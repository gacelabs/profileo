function getLongLivedToken(shortLivedToken) {
	const appId = '683063910346451';
	const appSecret = '71ecf8f39cb3a086c0ebbc6930ffa12e';

	return fetch(`https://graph.facebook.com/v13.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`)
		.then(response => response.json())
		.then(data => data.access_token)
		.catch(error => {
			console.error('Error exchanging token:', error);
			throw error;
		});
}


function storeToken(token, expirationTime) {
    localStorage.setItem('fbAccessToken', token);
    localStorage.setItem('fbTokenExpiry', expirationTime);
}

function isTokenExpired() {
    const expiry = localStorage.getItem('fbTokenExpiry');
    return Date.now() > expiry;
}

function getAccessToken() {
    if (isTokenExpired()) {
        // Prompt user to log in again
        facebookLogin();
    } else {
        return localStorage.getItem('fbAccessToken');
    }
}

function facebookLogin() {
    facebookConnectPlugin.login(['public_profile', 'email'], function(response) {
        if (response.authResponse) {
            const shortLivedToken = response.authResponse.accessToken;
            getLongLivedToken(shortLivedToken).then(longLivedToken => {
                const expirationTime = Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days
                storeToken(longLivedToken, expirationTime);
                checkFacebookProfile(longLivedToken);
            });
        } else {
            console.log('User cancelled login or did not fully authorize.');
        }
    }, function(error) {
        console.log('Login failed: ' + error);
    });
}

function checkFacebookProfile() {
    const accessToken = getAccessToken();
    if (accessToken) {
        fetchFacebookProfileData(accessToken)
            .then(data => {
                if (data.hasIssues) {
                    notifyUser('There are issues on your Facebook profile.');
                } else {
                    console.log('Profile is in good standing.');
                }
            })
            .catch(error => {
                console.error('Error checking profile:', error);
                notifyUser('Error checking profile. Please try again later.');
            });
    }
}
