let config = {
    "navitems": [
        {"name": "Books", "url": "/books"},
        {"name": "Sports", "url": "/sports"}
    ],
    "auth": {
        "auth": {
            "clientId": '2e4365d1-29b8-4b39-a0a4-fedaa8cfc675',
            "redirectUri": 'http://localhost:5003',
            "authority": 'https://login.microsoftonline.com/3ea8a579-a1b4-4af9-b63e-7fdc82963153'
        },
        "cache": {
            "cacheLocation": 'sessionStorage',
			"storeAuthStateInCookie": false
        }
    }
}

export default config;