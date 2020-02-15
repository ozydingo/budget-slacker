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

def build_step_name(ctx):
    return '%s-upload-function-code' % (ctx.env['name'])

def function_name(ctx):
    return ctx.env['name'] + '-function'

def generate_build_step(ctx):
    in_memory_output_file = BytesIO()
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
    hexdigest = m.hexdigest()
    source_archive_url = 'gs://%s/%s' % (
        ctx.properties['codeBucket'],
        hexdigest + '.zip'
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
        'name': 'code-%s' % (function_name(ctx)),
        'path': '/%s' % (ctx.properties['codeLocation'])
    }]
    zip_steps = [
        {
            'name': 'ubuntu',
            'args': ['bash', '-c', cmd],
            'volumes': volumes,
        } for cmd in cmds
    ]
    build_step = {
        'name': build_step_name(ctx),
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
    meta = {
        'hexdigest': hexdigest,
        'source_archive_url': source_archive_url
    }
    return build_step, meta

def generate_cloud_function(ctx, source_archive_url, source_archive_hexdigest):
    cloud_function = {
        'type': 'gcp-types/cloudfunctions-v1:projects.locations.functions',
        'name': function_name(ctx),
        'properties': {
            'parent':
                '/'.join([
                    'projects', ctx.env['project'], 'locations',
                    ctx.properties['location']
                ]),
            'function':
                function_name(ctx),
            'labels': {
                # Add the hash of the contents to trigger an update if the bucket
                # object changes
                'content-md5': source_archive_hexdigest
             },
            'sourceArchiveUrl':
                source_archive_url,
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
            'dependsOn': [build_step_name(ctx), ctx.properties['pubsub_topic']]
        }
    }
    
    return cloud_function

def GenerateConfig(ctx):
    """Generate YAML resource configuration."""
    build_step, build_step_meta = generate_build_step(ctx)
    cloud_function = generate_cloud_function(
        ctx,
        source_archive_url=build_step_meta['source_archive_url'],
        source_archive_hexdigest=build_step_meta['hexdigest']
    )

    resources = [build_step, cloud_function]

    return {
        'resources':
            resources,
        'outputs': [{
            'name': 'sourceArchiveUrl',
            'value': build_step_meta['source_archive_url']
        }, {
            'name': 'name',
            'value': '$(ref.' + function_name(ctx) + '.name)'
        }]
    }
