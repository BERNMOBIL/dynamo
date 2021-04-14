"use strict";

controllerModule.filter('filterDataBy', function(){
    return function(data, firstParam){
        var returnData = [];
        angular.forEach(data, function(value, index){
            angular.forEach(value[firstParam], function(val, ind){
                    returnData.push(val)
            });
        });
        return returnData;
    }
});