function Auth()
{
    try{
        this.googleAuth = null;
        gapi.load('client:auth2', this.start.bind(this));
    
        this.AUTH_SCOPES = "https://www.googleapis.com/auth/drive.file";
    }
    catch(error)
    {
        App.logError(error);
    }
    
}
Auth.prototype.start = function() {
    try{
        const auth = this;
        // In practice, your app can retrieve one or more discovery documents.
        const discoveryUrl = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
        // Initialize the gapi.client object, which app uses to make API requests.
        // Get API key and client ID from API Console.
        // 'scope' field specifies space-delimited list of access scopes.
        gapi.client.init({
            'clientId': '551367486725-fj8aa0c7o02rj2mi3s6tq2758ef35vqr.apps.googleusercontent.com',
            'discoveryDocs': [discoveryUrl],
            'scope': auth.AUTH_SCOPES
        }).then(function () {
            auth.googleAuth = gapi.auth2.getAuthInstance();
            // Listen for sign-in state changes.
            auth.googleAuth.isSignedIn.listen(auth.receivedAuthStatusUpdate.bind(auth));
            // Handle initial sign-in state. (Determine if user is already signed in.)
            const user = auth.googleAuth.currentUser.get();
            auth.receivedAuthStatusUpdate();
        });
    }
    catch(error)
    {
        App.logError(error);
    }   
}
Auth.prototype.receivedAuthStatusUpdate = function() {
    try{
        const user = this.googleAuth.currentUser.get();
        const profile = user.getBasicProfile();
        const isAuthorized = user.hasGrantedScopes(this.AUTH_SCOPES);
        if (isAuthorized) {
            let userData = {
                id: profile.getId(),
                name: profile.getName(),
                email: profile.getEmail(),
                avatar: profile.getImageUrl()
            };
            App.signedIn(userData);
        } else {
            App.signedOut();
        }
    }
    catch(error)
    {
        App.logError(error);
    }   
}
Auth.prototype.signIn = function() {
    if (this.googleAuth.isSignedIn.get())
        return;
    this.googleAuth.signIn();
}
Auth.prototype.signOut = function() {
    if (!this.googleAuth.isSignedIn.get())
        return;
    this.googleAuth.signOut();
}