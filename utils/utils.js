(function(global) {
    "use strict;"

    var config = require('./config');
    var syncRequest = require('sync-request');
    
    // Class ------------------------------------------------
    function Utils() {};

    // Header -----------------------------------------------
    Utils.prototype.isUndefinedOrNull = isUndefinedOrNull;
    Utils.prototype.isValidPhoneNumber = isValidPhoneNumber;
    Utils.prototype.isValidEmail = isValidEmail;
    Utils.prototype.generateErrorDetails = generateErrorDetails; 
    Utils.prototype.buildAttribute = buildAttribute;
    Utils.prototype.getAddressByLatLng = getAddressByLatLng;   
    
    // Implementation ---------------------------------------

    function isUndefinedOrNull(obj) {
        return obj === undefined || obj === null;
    }
    
    // This function is used to validate the format of phone number
    // Phone numbers must be at least 10 characters in length. 
    // Accepted characters include digits 0 through 9, “+”, white space and the minus sign (used as a hyphen in this case). 
    // Valid examples include “+61-3-9999-9999”, “03 9999 9999”, +61 411 111 111, 0411-111-111.
    function isValidPhoneNumber(phoneNumber) {
        return /^.{10,}$/.test(phoneNumber) && /^\+?[0-9]+([\s-]?[0-9])+$/.test(phoneNumber);
    }

    // This function is used to validate a simple email format
    function isValidEmail(email) {
        return /^([\w_\.\-\+])+\@([\w\-]+\.)+([\w]{2,10})+$/.test(email);
    }    
    
    function generateErrorDetails(code, reasonPhrase, details) {
        var sendback = {
                errorCode : {
                    code : code,
                    reasonPhrase : reasonPhrase,
                    details : details
                }
            }
        return sendback;
    }
    
    function buildAttribute(name, type, value) {
        return {
            name: name,
            type: type,
            value: value
        };
    }

    function getAddressByLatLng(lat,lng) {        
        var sendback = 'Unknown Address';
        try {
            var url = config.googlemap.apiUrl + "?latlng=" + lat + "," + lng + "&key=" + config.googlemap.apiKey;
            var res = syncRequest('GET', url);
            var json = JSON.parse(res.getBody().toString());
            if(json.status && json.status === 'OK') {
                if(json.results && json.results.length && json.results.length > 0)
                    sendback = json.results[0].formatted_address
            }            
        } catch(e) {
            console.log("Failed to get an address from google api by latlng: " + lat + "," + lng);            
        }        
        return sendback;
    }

    // Exports ----------------------------------------------
    module["exports"] = new Utils();

})((this || 0).self || global);
