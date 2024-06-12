document.addEventListener('DOMContentLoaded', function () {
	// Initialize the Facebook SDK
	window.fbAsyncInit = function () {
		FB.init({
			appId: '683063910346451', // Replace with your Facebook App ID
			cookie: true,
			xfbml: true,
			version: 'v2.7'
		});
		FB.AppEvents.logPageView();

		// Check login status on page load
		FB.getLoginStatus(function (response) {
			statusChangeCallback(response);
		});
	};

	// Load the SDK asynchronously
	(function (d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) { return; }
		js = d.createElement(s); js.id = id;
		js.src = "https://connect.facebook.net/en_US/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));

	// Request notification permission
	if (Notification.permission === "default") {
		Notification.requestPermission().then(permission => {
			if (permission === "granted") {
				console.log("Notification permission granted.");
			} else {
				console.log("Notification permission denied.");
			}
		});
	}
});

function statusChangeCallback(response) {
	if (response.status === 'connected') {
		// Logged into your app and Facebook.
		const shortLivedToken = response.authResponse.accessToken;
		const expirationTime = Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days
		storeToken(shortLivedToken, expirationTime);
		checkFacebookProfile(shortLivedToken);
	} else {
		// The person is not logged into your app or we are unable to tell.
		notifyUser('Please log into Facebook.');
	}
}

function facebookLogin() {
	FB.login(function (response) {
		if (response.authResponse) {
			checkFacebookProfile(response.authResponse.accessToken);
		} else {
			console.log('User cancelled login or did not fully authorize.');
		}
	}, { scope: 'public_profile,email' });
}

function checkFacebookProfile(accessToken) {
	// if (isTokenExpired() == false) {
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
	// } else {
	// 	getLongLivedToken(accessToken).then(longLivedToken => {
	// 		const expirationTime = new Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days
	// 		storeToken(longLivedToken, expirationTime);
	// 		checkFacebookProfile(longLivedToken);
	// 	});
	// }
}

async function fetchFacebookProfileData(accessToken) {
	return fetch(`https://graph.facebook.com/v13.0/me?fields=about,name,picture&access_token=${accessToken}`)
		.then(response => response.json())
		.then(data => {
			// Check for issues in the profile data
			let hasIssues = false;

			// Implement your logic to determine if there are issues
			if (!data.about) {
				hasIssues = true;
			}

			return { hasIssues };
		})
		.catch(error => {
			console.error('Error fetching profile data:', error);
			throw error;
		});
}

function notifyUser(message) {
	if (Notification.permission === "granted") {
		new Notification("Profile Notifier", {
			body: message,
			icon: "icon.png" // Optionally include an icon
		});
	} else {
		document.getElementById('notification').innerHTML = message;
	}
}

async function getLongLivedToken(shortLivedToken) {
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
