socket = io("http://localhost:3000");

socket.emit("sendAccessToken",{},accessToken=>{
    console.log(accessToken);

    $('#allergyName').keyup(e=>{
        
        const diseaseQuery = $(e.target).val();
        
        var settings = {
            "url": `http://www.healthos.co/api/v1/autocomplete/diseases/${diseaseQuery}`,
            "method": "GET",
            "timeout": 0,
            "headers": {
                "Authorization": `Bearer ${accessToken}`
            },
        };

        $.ajax(settings).done(function (response) {

            const suggestions_json = response.filter(disease => disease.disease_cat.includes('Immune diseases') );

            let suggestions=[];
            for(let i=0;i<suggestions_json.length;i++){
                suggestions.push({
                    label:suggestions_json[i].disease_name,
                    desc:suggestions_json[i].disease_info
                });
            }

            $(function(){

                $( "#allergyName" ).autocomplete({
                    source: suggestions,
                    minLength: 0
                })
                .autocomplete( "instance" )._renderItem = function( ul, disease ) {
                    return $( "<li>" )
                    .append( `<div> ${disease.label} </div> <div class='text-muted'> ${disease.desc.substring(0,70)}...</div><div class='dropdown-divider'></div>` )
                    .appendTo( ul );
                };
            });
            
        });
    });

    $('#disabilityName').keyup(e=>{
        const diseaseQuery = $(e.target).val();
        
        var settings = {
            "url": `http://www.healthos.co/api/v1/autocomplete/diseases/${diseaseQuery}`,
            "method": "GET",
            "timeout": 0,
            "headers": {
                "Authorization": `Bearer ${accessToken}`
            },
        };

        $.ajax(settings).done(function (response) {

            let suggestions=[];
            for(let i=0;i<response.length;i++){
                suggestions.push({
                    label:response[i].disease_name,
                    desc:response[i].disease_info
                });
            }

            $(function(){

                $( "#disabilityName" ).autocomplete({
                    source: suggestions,
                    minLength: 0
                })
                .autocomplete( "instance" )._renderItem = function( ul, disease ) {
                    return $( "<li>" )
                    .append( `<div> ${disease.label} </div> <div class='text-muted'> ${disease.desc.substring(0,70)}...</div><div class='dropdown-divider'></div>` )
                    .appendTo( ul );
                };
            });
            
        });
    });

    $('#geneticDisorderName').keyup(e=>{
        const diseaseQuery = $(e.target).val();

        var settings = {
            "url": `http://www.healthos.co/api/v1/autocomplete/diseases/${diseaseQuery}`,
            "method": "GET",
            "timeout": 0,
            "headers": {
                "Authorization": `Bearer ${accessToken}`
            },
        };

        $.ajax(settings).done(function (response) {
            console.log(response);

            const suggestions_json = response.filter(disease => disease.disease_cat.includes('Genetic diseases') );

            let suggestions=[];
            for(let i=0;i<suggestions_json.length;i++){
                suggestions.push({
                    label:suggestions_json[i].disease_name,
                    desc:suggestions_json[i].disease_info
                });
            }

            console.log(suggestions);
            $(function(){

                $( "#geneticDisorderName" ).autocomplete({
                    source: suggestions,
                    minLength: 0
                })
                .autocomplete( "instance" )._renderItem = function( ul, disease ) {
                    return $( "<li>" )
                    .append( `<div> ${disease.label} </div> <div class='text-muted'> ${disease.desc.substring(0,70)}...</div><div class='dropdown-divider'></div>` )
                    .appendTo( ul );
                };
            });
            
        });
    });
    
});





$('#allergyCheck').click(e=>{
    $('#allergyName').slideToggle();
})

$('#disabilityCheck').click(e=>{
    $('#disabilityName').slideToggle();
})

$('#geneticDisorderCheck').click(e=>{
    $('#geneticDisorderName').slideToggle();
})
