import jQuery from 'jquery';

jQuery('document').ajaxError((
    event : Event,
    jqXHR : Object,
    ajaxSettings : Object,
    thrownError : string
    ) => 
    {
        console.error('error happened during execution');
    });

jQuery('document').ajaxSuccess((
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

    getJSON(url : URL, accessToken : string)
    {
        return jQuery.ajax(
            {
                accepts: 
                {
                    json: 'application/json'
                },
                url: url,
                headers: 
                {
                    Authorization: 'Bearer ' + accessToken
                },
                method: 'GET',
                statusCode: 
                {
                    404: () => {console.error('resource not found');},
                    401: () => {console.error('not authorized to access resource');},
                    500: () => {console.error('error occured serverside');}
                },
                timeout: 5000
            });
    }

    putJSON()
    {
        return jQuery.ajax();
    }

    deleteJSON()
    {
        return jQuery.ajax();
    }

    postJSON()
    {
        return jQuery.ajax();
    }
}