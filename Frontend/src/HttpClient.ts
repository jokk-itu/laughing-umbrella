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

    putJSON(url : URL, accessToken : string, data : Object)
    {
        return jQuery.ajax({
            accepts:
            {
                json: 'application/json'
            },
            url: url,
            headers: 
            {
                Authorization: 'Bearer' + accessToken
            },
            method: 'PUT',
            data: data,
            statusCode: 
            {
                404: () => {console.error('resource not found');},
                401: () => {console.error('not authorized to access resource');},
                500: () => {console.error('error occured serverside');}
            },
            timeout: 5000
        });
    }

    deleteJSON()
    {
        return jQuery.ajax();
    }

    patchJSON(url : URL, accessToken : string, data : Object) 
    {
        return jQuery.ajax({
            accepts:
            {
                json: 'application/json'
            },
            url: url,
            headers: 
            {
                Authorization: 'Bearer' + accessToken
            },
            method: 'PATCH',
            data: data,
            statusCode: 
            {
                404: () => {console.error('resource not found');},
                401: () => {console.error('not authorized to access resource');},
                500: () => {console.error('error occured serverside');}
            },
            timeout: 5000
        }
        );
    }

    postJSON(url : URL, accessToken : string, data : Object)
    {
        return jQuery.ajax({
            accepts:
            {
                json: 'application/json'
            },
            url: url,
            headers: 
            {
                Authorization: 'Bearer' + accessToken
            },
            method: 'POST',
            data: data,
            statusCode: 
            {
                404: () => {console.error('resource not found');},
                401: () => {console.error('not authorized to access resource');},
                500: () => {console.error('error occured serverside');}
            },
            timeout: 5000
        }
        );
    }
}