/**
 * @NapiVersion 2.0
 * @NscriptType ScheduledScript
 */

define (['N/search','N/https','N/log'], function(search,https,log){

    var baseUrl = "https://api.hubapi.com/crm/v3/objects/products"

    var hsSku = {}

    function NetSuiteItems(){
        try{
            var itemSearch = search.create({
                type: search.Type.ITEM,
                filters : [search.createFilter({
                    name: "vendorname",
                    operator: search.Operator.IS,
                    values: 'John Vendor'
                })],
                columns: ['itemid', 'upccode', 'displayname', 'cost']
            })

            var searchedResults = itemSearch.run().getRange({ start: 0 , end: 10})

            var formatedData = []
            searchedResults.forEach( function(result) {
                var itemData = {
                    "name" : result.getValue({name : "itemid"}),
                    "hs_sku": result.getValue({name:"upccode"}),
                    "description" : result.getValue({ name: "displayname"}),
                    "price": result.getValue({name: "cost"})
                }
                
                formatedData.push(itemData)
            })

            exportToHubSpot(formatedData)
        }
        catch(error){
            log.error({
                title: "Error occured in function NetSuiteItems: ",
                details: error.message
            })
        }
    }

    function exportToHubSpot(data){
        try{
            var accessToken = "pat-na1-591dd51f-675c-4d65-8fd2-b2ae2f88227f"

            var header = {
              Accept: "*/*",
              "Content-Type": "application/json",
              Authorization: "Bearer " + accessToken
            }; 
            var ApiUrl = baseUrl

            for ( var i=0 ; i < data.length ; i++){
                var itemData = data[i]
                log.debug("SKU code: " , itemData.hs_sku)
                if (hsSku[itemData.hs_sku]){
                    log.debug("Product with SKU: " , itemData.hs_sku + " already exists in HubSpot")
                    continue
                }

                var requestData = {
                    "properties" : {
                        "name" : itemData.name,
                        "hs_sku": itemData.hs_sku,
                        "description" : itemData.description,
                        "price" : itemData.price
                    }   
                }
                var response = https.post({
                    url : ApiUrl,
                    body : JSON.stringify(requestData),
                    headers : header
                })
                
                if (response.code === 201){
                    log.debug("Export to HubSpot 'POST' response: " , response)
                } else {
                    log.error("Error occured in response with code: " , response.code)
                }
            }

        }
        catch(error){
            log.error({
                title: "Error in exportToHubSpot: ",
                details: error.message
            })
        }
    }
    function doesProductExistinHubSpot(){
        try {
            var apiUrl = baseUrl
            var accessToken = ""
            var QueryParams = "?properties=hs_sku&archived=false"

            var API = apiUrl + QueryParams
            var header = {
                Accept: "*/*",
                "Content-Type": "application/json",
                Authorization: "Bearer " + accessToken
            }
            var response = https.get({
                url : API,
                headers : header
            })
            
            var JsonResponse = JSON.parse(response.body)
            
            
            JsonResponse.results.forEach(function(item) {
                hsSku[item.properties.hs_sku] = true;
            });
            
        }
        catch(error){
            log.error({
                title:  "Error occured in doesProductExistinHubSpot function : ",
                details: error.message
            })
        }
    }

    function execute(context){
        doesProductExistinHubSpot()
        NetSuiteItems()
        
    }
    return{
        execute:execute
    }
})
