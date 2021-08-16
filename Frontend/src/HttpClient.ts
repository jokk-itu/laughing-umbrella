import jQuery from 'jquery';

const document = jQuery('document');
document.ajaxError((
    event : Event,
    jqXHR : Object,
    ajaxSettings : Object,
    thrownError : string
    ) => 
    {
        console.error('error happened during execution');
    });

document.ajaxSuccess((
    event : Event,
    jqXHR : Object,
    ajaxSettings : Object,
    thrownError : string
    ) => 
    {
        console.log('successfully executed request');
    });

export class HttpClient
{
    constructor() {}

    private send(url : URL, accessToken : string, method : string, data? : Object)
    {
        return jQuery.ajax({
            accepts: { json : 'application/json' },
            url: url,
            headers: { Authorization: 'Bearer' + accessToken },
            method: method,
            data: data,
            statusCode:
                {
                    //THIS COULD BE USED TO LOG STUFF
                    404: () => {console.error('resource not found')},
                    401: () => {console.error('not authorized to access resource')},
                    500: () => {console.error('error occurred serverside')}
                },
            timeout: 5000
        });
    }

    getJSON(url : URL, accessToken : string)
    {
        return this.send(url, accessToken, 'GET');
    }

    putJSON(url : URL, accessToken : string, data : Object)
    {
        return this.send(url, accessToken, 'PUT', data);
    }

    deleteJSON(url : URL, accessToken : string, data?: Object)
    {
        return this.send(url, accessToken, 'DELETE', data);
    }

    patchJSON(url : URL, accessToken : string, data : Object) 
    {
        return this.send(url, accessToken, 'PATCH', data);
    }

    postJSON(url : URL, accessToken : string, data : Object)
    {
        return this.send(url, accessToken, 'POST', data);
    }
}