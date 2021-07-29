import { Configuration, PublicClientApplication } from '@azure/msal-browser';
import type { AuthenticationResult } from '@azure/msal-browser';

export interface IAuthService 
{
    login() : Promise<void>
    logout() : Promise<void>
    getToken(scopes : string[]) : Promise<AuthenticationResult>
    getUser() : Promise<AuthenticationResult>;
}

export class AuthService implements IAuthService
{
    private client : PublicClientApplication;
    private user : AuthenticationResult;

    constructor(config : Configuration) 
    {
        this.client = new PublicClientApplication(config);
    }

    getUser(): Promise<AuthenticationResult> 
    {
        if(this.user == null) 
        {
            return new Promise<AuthenticationResult>(
                (resolve, reject) => 
                {
                    reject();
                });
        }
        return new Promise<AuthenticationResult>(
            (resolve, reject) => 
            {
                resolve(this.user);
            });
    }

    async login() : Promise<void> 
    {
        this.client.loginPopup({
			scopes: ['openid', 'profile', 'offline_access'],
			prompt: 'select_account' 
		})
		.then((result : AuthenticationResult) => {
			this.user = result;
		})
		.catch((e : Error) => {
			console.error('Can\'t login: ' + e.message);
		});
    }

    async logout() : Promise<void> 
    {
        await this.client.logoutPopup();
    }

    async getToken(scopes : string[]) : Promise<AuthenticationResult> 
    {
        if(this.user == null) 
        {
            throw new Error('User is not logged in');
        }
        const account = this.client.getAccountByUsername(this.user.account.username);
		const request = 
        {
			scopes: scopes,
			account: account
		};
		try {
			const response = await this.client.acquireTokenSilent(request);
			return await new Promise<AuthenticationResult>((resolve,reject) => {
				resolve(response);
			});
		} catch(error) {
			return await this.client.acquireTokenPopup(request);
		}
    }
}

