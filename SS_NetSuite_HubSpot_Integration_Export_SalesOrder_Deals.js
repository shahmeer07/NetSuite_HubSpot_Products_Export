/**
 * @NapiVersion 2.0
 * @NScriptType ScheduledScript
 */

define(['N/search', 'N/log', 'N/https'], function (search, log,https) {

    // Function to Change date format from NetSuite to HubSpot formatted date
    function formatDate(dateString) {
        var date = new Date(dateString);
        return date.toISOString();
    } 


    var accesstoken = ""


    // Function to map correct deal stage in HubSpot coming in from NetSuite Sales Order status 

    function mapDealStage(status){
        var stageMap ={
            "Pending Approval" : "qualifiedtobuy"
        }
        return stageMap[status] || "qualifiedtobuy"
    }

    // Function to map correct deal type in HubSpot coming in from NetSuite Sales Order class

    function mapDealType(dealclass){

        var typemap = {
            "Advisory : Interim Leadership" : "existingbusiness"
        }
        return typemap[dealclass] || 'existingbusiness'
    }

    // Function to get all the Sales Orders from NetSuite (filtered to get the latest sales orders)
    function getSalesOrdersFromNetSuite() {
        try {
            var startdate = '04/15/2024';
            var salesOrderSearch = search.create({
                type: search.Type.SALES_ORDER,
                filters: [
                    ['trandate', 'onorafter', startdate]
                ],
                columns: ['tranid','total','enddate','status', 'class']
            });

            var searchedResults = salesOrderSearch.run().getRange({ start: 0, end: 5 });

            var processedOrders = {}
            var formatedData = []

            searchedResults.forEach(function (result) {
                var orderId = result.getValue({ name: 'tranid' });

                if (!processedOrders[orderId]){

                var amount = result.getValue({ name: 'total' });
                var closeDate = result.getValue({ name: 'enddate' });
                var dealStage = mapDealStage(result.getText({ name: 'status' }))
                var dealType = mapDealType(result.getText({ name: "class"}))

                // Object to send as a body for HubSpot Export deals API 
                var salesData = {
                        dealname: orderId,
                        amount: amount,
                        closedate: formatDate(closeDate),
                        dealstage: dealStage,
                        dealtype: dealType
                };

            
                processedOrders[orderId] = true

                formatedData.push(salesData)
                log.debug("Sales Order formated Data: " , formatedData)
                
            }
            
            });
            if ( formatedData.length > 0){
                ExportSalesDataToHubSpot(formatedData)
            }

        } catch (error) {
            log.error({
                title: "Error occurred in getting sales orders from NetSuite function: ",
                details: error.message
            });
        }
    }


    function ExportSalesDataToHubSpot(data){
        try{
            Baseurl = "https://api.hubapi.com"
            API = "/crm/v3/objects/deal"

            var header = {
                Accept: "*/*",
                "Content-Type": "application/json",
                Authorization: "Bearer " + accesstoken
            }

            data.forEach( function(deal){

                var payload = {
                    properties: deal
                }

                log.debug("Payload to POST : " , payload)
                var response = https.post({
                    url: Baseurl + API,
                    body: JSON.stringify(payload),
                    headers: header
                })
                log.debug("POST response: " , response.code + " body: " + response.body)
            })

            

        }
        catch(error){
            log.error({
                title: "Error occured in ExportSalesDataToHubSpot function: ",
                details: error.message
            })
        }
    }


    function execute(context) {
        getSalesOrdersFromNetSuite();
    }

    return {
        execute: execute
    };
});
