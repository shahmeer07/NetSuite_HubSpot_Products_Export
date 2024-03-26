/**
 * @NapiVersion 2.0
 * @NscriptType ScheduledScript
 */

define (['N/search','N/https','N/log'], function(search,https,log){

    var baseUrl = "https://api.hubapi.com/crm/v3/objects/products"

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
                log.debug("Item Data: ", itemData)
                formatedData.push(itemData)
            })

            log.debug("Formated Data: " , formatedData)
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
            var accessToken = ""

            var header = {
              Accept: "*/*",
              "Content-Type": "application/json",
              Authorization: "Bearer " + accessToken,
            }; 
            var ApiUrl = baseUrl

            for ( var i=0 ; i < data.length ; i++){
                var itemData = data[i]
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
                log.debug("response body: " , response.body)
                if (response.code === 201){
                    log.debug("Export to HubSpot 'POST' response: " , response)
                } else {
                    log.error("Error occured in response with code: " , response.code)
                }
            }

        }
        catch(error){
            log.error({
                title: "Error in exploreToHubSpot: ",
                details: error.message
            })
        }
    }

    function execute(context){
        NetSuiteItems()
    }
    return{
        execute:execute
    }
})
