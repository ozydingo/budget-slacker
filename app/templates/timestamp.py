import datetime

def GenerateConfig(ctx):
    return {
        'resources': [],
        'outputs': [
            {
                'name': 'timestamp',
                'value': datetime.datetime.timestamp(datetime.datetime.now())
            }
        ]
    }
