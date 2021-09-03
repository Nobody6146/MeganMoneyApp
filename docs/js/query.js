function Query() {

}
Query.get = function(range, valueRenderOption = "UNFORMATTED_VALUE", spreadsheetId = App.storage.spreadsheet) {
    return new Promise( (resolve, reject) => {
        gapi.client.sheets.spreadsheets.values.get({spreadsheetId, range: range, valueRenderOption})
        .then(res => {
            console.log(res);
            const raw = JSON.parse(res.body).values;
            let list = [];
            for(let i = 1; i < raw.length; i++)
            {
                let row = {};
                for(let j = 0; j < raw[i].length; j++)
                    row[raw[0][j]] = raw[i][j];
                list.push(row);
            }
            resolve(list);
        })
        .catch(err => {
            reject(err);
        });
    });
    
}
Query.update = function(range, values, valueInputOption = "USER_ENTERED", spreadsheetId = App.storage.spreadsheet) {
    const valueRange = {
        range: range,
        majorDimension: "ROWS",
        values: values
    }
    return new Promise( (resolve, reject) => {
        gapi.client.sheets.spreadsheets.values.update({spreadsheetId, range: range, valueInputOption}, valueRange)
        .then(res => {
            resolve(res.result);
        })
        .catch(err => {
            reject(err);
        });
    });
}
Query.insert = function(range, values, valueInputOption = "USER_ENTERED", insertDataOption = "INSERT_ROWS", spreadsheetId = App.storage.spreadsheet) {
    const valueRange = {
        range: range,
        majorDimension: "ROWS",
        values: values
    };
    return new Promise( (resolve, reject) => {
        gapi.client.sheets.spreadsheets.values.append({spreadsheetId, range: range, valueInputOption, insertDataOption}, valueRange)
        .then(res => {
            resolve(res.result);
        })
        .catch(err => {
            reject(err);
        });
    });
}
Query.info = {
    get: function() {
        return Query.get("info");
    },
    update: function(array, row = "A2") {
        return Query.update("info!" + row, array.map(x => Object.values(x)));
    }
}
Query.settings = {
    get: function() {
        return Query.get("settings");
    },
    update: function(array) {
        return Query.update("settings!A2", array.map(x => Object.values(x)));
    }
}
Query.labels = {
    get: function() {
    return Query.get("labels");
    },
    update: function(array) {
        return Query.update("labels!A2", array.map(x => Object.values(x)));
    }
}
Query.transactions = {
    get: function() {
    return Query.get("transactions");
    },
    update: function(array) {
        return Query.update("transactions!A2", array.map(x => Object.values(x)));
    }
}
Query.importSettings = function() {
    return Query.get("importSettings");
}
Query.budgets = function() {
    return Query.get("budgets");
}