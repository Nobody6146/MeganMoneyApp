function Auth()
{
    this.isAuthorized = false;
    try{
        this.googleAuth = null;
        gapi.load('client:auth2', this.start.bind(this));
    
        this.AUTH_SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets";
    }
    catch(error)
    {
        App.logError(error);
    }
    
}
Auth.prototype.start = function() {
    try{
        this.isAuthorized = false;
        const auth = this;
        // In practice, your app can retrieve one or more discovery documents.
        const discoveryDocs = ['https://sheets.googleapis.com/$discovery/rest?version=v4', 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
        // Initialize the gapi.client object, which app uses to make API requests.
        // Get API key and client ID from API Console.
        // 'scope' field specifies space-delimited list of access scopes.
        gapi.client.init({
            'clientId': '551367486725-fj8aa0c7o02rj2mi3s6tq2758ef35vqr.apps.googleusercontent.com',
            'discoveryDocs': discoveryDocs,
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
        this.isAuthorized = user.hasGrantedScopes(this.AUTH_SCOPES);

        if (this.isAuthorized) {
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
Auth.prototype.isSignedIn = function() {
    return this.isAuthorized;
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
Auth.prototype.denyPermission = function() {
    if (!this.googleAuth.isSignedIn.get())
        return;
    this.googleAuth.disconnect();
}

const spreadsheet = {
    properties: {
        title: "MeganMoney-Budget"
    },
    sheets: [
        {
            properties: {
                title: "Info"
            }
            // ,
            // data: {
            //     startRow: 0,
            //     startColumn: 0,
            //     rowData: {
            //         values: [

            //         ]
            //     }
            // }
        },
        {
            properties: {
                title: "Settings"
            }
        },
        {
            properties: {
                title: "ImportFiles"
            }
        },
        {
            properties: {
                title: "Labels"
            }
        },
        {
            properties: {
                title: "Transactions"
            }
        },
    ]
    // namedRanges: [
    //     {
    //         namedRangeId: "0",
    //         name: "info",
    //         range: {
    //             sheetId: 0,
    //             // startRowIndex: integer,
    //             // endRowIndex: integer,
    //             startColumnIndex: 0,
    //             endColumnIndex: 2
    //         }
    //     },
    //     {
    //         name: "info.id",
    //         range: {
    //             sheetId: 0,
    //             startRowIndex: 0,
    //             endRowIndex: 0,
    //             startColumnIndex: 0,
    //             endColumnIndex: 0
    //         }
    //     },
    //     {
    //         name: "info.field",
    //         range: {
    //             sheetId: 0,
    //             startRowIndex: 0,
    //             endRowIndex: 0,
    //             startColumnIndex: 1,
    //             endColumnIndex: 1
    //         }
    //     },
    //     {
    //         name: "info.value",
    //         range: {
    //             sheetId: 0,
    //             startRowIndex: 0,
    //             endRowIndex: 0,
    //             startColumnIndex: 2,
    //             endColumnIndex: 2
    //         }
    //     }
    // ]
}