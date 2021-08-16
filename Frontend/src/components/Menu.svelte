<script>
    import {AuthService} from '../AuthService';
    import config from '../config';

    const _authService = new AuthService(config.auth);
</script>

<div class="uk-border-rounded uk-box-shadow-large uk-navbar-container" uk-navbar>
    <div class="uk-navbar-left">
        <button uk-toggle="target: #menu" class="mobile-menu uk-navbar-toggle" uk-navbar-toggle-icon/>
        <a href='/' class='desktop-menu uk-navbar-item uk-logo'>Logo</a>
    </div>
    <div class="mobile-menu uk-navbar-center">
        <a href='/' class='uk-navbar-item uk-logo'>Logo</a>
    </div>
    <div class="desktop-menu uk-navbar-right">
        <ul class="uk-navbar-nav">
            { #each config.navitems as item }
                <li class="uk-navbar-item">
                    <a href="{ item.url }">{ item.name }</a>
                </li>
            { /each   }
            <li class="uk-navbar-item">
                { #await _authService.getUser() }
                { :then authenticationResult }
                    <a on:click={ async () => await _authService.logout() } uk-icon="sign-out">Logout</a>
                { :catch error }
                    <a on:click={ async () => await _authService.login() } uk-icon="sign-in">Login</a>
                { /await }
            </li>
            <li class="uk-inline uk-navbar-item">
                    <a uk-icon="user">Account</a>
                    <div uk-drop="pos: bottom-left">
                        <div class="uk-card uk-card-body uk-card-default">
                            <ul class="uk-nav">
                                <li><a href="/profile">Profile</a></li>
                            </ul>
                        </div>
                    </div>
            </li>
        </ul>
    </div>
</div>

<div id='menu' uk-offcanvas='overlay: true'>
    <div class='uk-offcanvas-bar'>
        <button class='uk-offcanvas-close' type='button' uk-close></button>
        <a href='/' class='uk-navbar-item uk-logo'>Logo</a>
        <hr class="uk-divider">
        <ul class="uk-nav">
            { #each config.navitems as item }
                <li><a href={ item.url }>{ item.name }</a></li>
            { /each }
        </ul>
    </div>
</div>

<style>
    @media only screen and (max-width: 600px) {
        .desktop-menu {
            display: none;
        }
    }

    @media only screen and (min-width: 600px) {
        .mobile-menu {
            display: none;
        }
    }
</style>