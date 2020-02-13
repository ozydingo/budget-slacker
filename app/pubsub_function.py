# Copyright 2017 Google Inc. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Cloud Function (nicely deployed in deployment) DM template."""

import base64
import hashlib
from io import BytesIO
import zipfile


def GenerateConfig(ctx):
    """Generate YAML resource configuration."""
    in_memory_output_file = BytesIO()
    function_name = ctx.env['name'] + '-function'
    zip_file = zipfile.ZipFile(
        in_memory_output_file,
        mode='w',
        compression=zipfile.ZIP_DEFLATED
    )
    prefix = ctx.properties['codeLocation'] + '/';
    for imp in ctx.imports:
        if imp.startswith(prefix):
            zip_file.writestr(
                imp[len(prefix):],
                ctx.imports[imp]
            )
    zip_file.close()
    content = base64.b64encode(in_memory_output_file.getvalue())
    m = hashlib.md5()
    m.update(content)
    source_archive_url = 'gs://%s/%s' % (
        ctx.properties['codeBucket'],
        m.hexdigest() + '.zip'
    )
    chunk_length = 3500
    content_chunks = [content[ii:ii+chunk_length] for ii in range(0,len(content), chunk_length)]
    cmds = ["echo '%s' | base64 -d > /%s/%s;" % (
        content_chunks[0].decode('ascii'),
        ctx.properties['codeLocation'],
        ctx.properties['codeBucketObject']
    )]
    cmds += [
        "echo '%s' | base64 -d >> /%s/%s;" % (
            chunk.decode('ascii'),
            ctx.properties['codeLocation'],
            ctx.properties['codeBucketObject']
        )
        for chunk in content_chunks[1:]
    ]
    volumes = [{
        'name': 'code-%s' % (function_name),
        'path': '/%s' % (ctx.properties['codeLocation'])
    }]
    zip_steps = [
        {
            'name': 'ubuntu',
            'args': ['bash', '-c', cmd],
            'volumes': volumes,
        } for cmd in cmds
    ]
    build_step_name = '%s-upload-function-code' % (ctx.env['name'])
    build_step = {
        'name': build_step_name,
        'action': 'gcp-types/cloudbuild-v1:cloudbuild.projects.builds.create',
        'metadata': {
            'runtimePolicy': ['UPDATE_ON_CHANGE']
        },
        'properties': {
            'steps': zip_steps + [{
                'name': 'gcr.io/cloud-builders/gsutil',
                'args': [
                    'cp',
                    '/%s/%s' % (
                        ctx.properties['codeLocation'],
                        ctx.properties['codeBucketObject']
                    ),
                    source_archive_url
                ],
                'volumes': volumes
            }],
            'timeout':
            '120s'
        }
    }
    cloud_function = {
        'type': 'gcp-types/cloudfunctions-v1:projects.locations.functions',
        'name': function_name,
        'properties': {
            'parent':
                '/'.join([
                    'projects', ctx.env['project'], 'locations',
                    ctx.properties['location']
                ]),
            'function':
                function_name,
            'labels': {
                # Add the hash of the contents to trigger an update if the bucket
                # object changes
                'content-md5': m.hexdigest()
             },
            'sourceArchiveUrl':
                source_archive_url,
            'environmentVariables': {
                'codeHash': m.hexdigest(),
                **(ctx.properties['environmentVariables'] or {})
            },
            'entryPoint':
                ctx.properties['entryPoint'],
            'eventTrigger': {
                'resource': '$(ref.%s.name)' % (ctx.properties['pubsub_topic']),
                'eventType': 'providers/cloud.pubsub/eventTypes/topic.publish'
            },
            'timeout':
                ctx.properties['timeout'],
            'availableMemoryMb':
                ctx.properties['availableMemoryMb'],
            'runtime':
                ctx.properties['runtime']
            },
        'metadata': {
            'dependsOn': [build_step_name, ctx.properties['pubsub_topic']]
        }
    }
    resources = [build_step, cloud_function]

    return {
        'resources':
            resources,
        'outputs': [{
            'name': 'sourceArchiveUrl',
            'value': source_archive_url
        }, {
            'name': 'name',
            'value': '$(ref.' + function_name + '.name)'
        }]
    }
