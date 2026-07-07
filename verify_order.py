import json
import urllib.request

req = urllib.request.Request(
    'http://localhost:8000/api/orders',
    data=json.dumps({'itemName': 'Test Dish', 'price': '$10'}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req) as response:
    print(response.read().decode())
