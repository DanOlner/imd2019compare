var state = {
    zonehoveredover: null,
    setwhichmap: "top", //top or bottom
    topmapselection: "Sheffield",
    bottommapselection: "Birmingham"
}

//https://github.com/d3/d3-scale-chromatic
//https://github.com/d3/d3-scale#sequential-scales
//https://observablehq.com/@d3/sequential-scales
//Domain is full England ranks for IMD
//var bottom_colours = d3.scaleSequential(d3.interpolatePiYG).domain([1,32844]);
//var bottom_colours = d3.scaleSequential(d3.interpolateBrBG).domain([1,32844]);
var bottom_colours = d3.scaleSequential(d3.interpolatePRGn).domain([1,32844]);
var top_colours = d3.scaleSequential(d3.interpolateRdYlBu).domain([1, 32844]);
//var region_colours = d3.scaleSequential(d3.interpolateSinebow).domain([1, 9]);

//Nine regions: 18 to 1 so actual values only half the scale, not into too light greens
var region_colours = d3.scaleSequential(d3.interpolateGreens).domain([18, 1]);

//vertical sidebar scale
//least to most deprived over the range of the bar
//Might want to set sidebar up programmatically so can have range in one place
var sideBarVerticalScale = d3.scaleLinear().domain([1, 32844]).range([800, 0])




//https://stackoverflow.com/questions/11720141/set-onclick-event-using-script
$(".button").click(function () {

    //adds to class def in html...
    //https://stackoverflow.com/questions/16240892/jquery-change-button-color-onclick
    $(".button").removeClass('buttonselected')
    $(this).addClass('buttonselected');

    state.setwhichmap = this.value



})







function updateAll() {

    updateTopMap()


}


function updateEnglandMap() {

    //ladpath is set as global var in map setup

    var engmap = d3.select("g.enghexmap")
            .selectAll("path")
            .data(englandgeofeatures.features, function (d) {
                return (d.properties.c)
            })

    engmap.enter().append("path")
            .attr("id", function (d, i) {
                return("lad_index" + i)
            })
            .attr("class", "eng_path")
            .attr("d", ladpath)
            .merge(engmap)
            .style("fill", function (d) {
                if (state.zonehoveredover === d.properties.n) {
                    return("rgb(0,255,100)")
                } else {
                    return(region_colours(d.properties.regionindex))
                }
            })
            .on("mouseover", function (d) {
                state.zonehoveredover = d.properties.n
                setName()
                updateEnglandMap()
            })
            .on("mouseout", function (d) {
                //Get rid of LA name when not hovering over the map
                state.zonehoveredover = ""
                setName()
                updateEnglandMap()//need this so all sets back to non-highlighted
            })
            .on("click", function (d) {

                state.topmapselection = d.properties.n

                d3.selectAll(".leftmap_path")
                        .remove()

                //make sure any existing lines are removed
                d3.selectAll(".sidebarline")
                        .remove()


                loadTopMapData(d.properties.n)

            })

}





function updateTopMap() {

    var leftmap = d3.select("g.topmap")
            .selectAll("path")
            .data(geofeatures.features, function (d) {
                return (d.properties.name)
            })

//This will be null. If called in the .then promise below, it's fine.
//console.log("geofeatures?" + geofeatures)
    leftmap.enter().append("path")
            .attr("id", function (d, i) {
                return("lsoa_index" + i)
            })
            .attr("class", "leftmap_path")
            .attr("d", leftmappath)
            .merge(leftmap)
            .style("fill", function (d) {
                return(top_colours(d.properties.Value))
            })

}



//Can update this to work for both, right? Maybe?
function updateLocalAuthorityMap(geofeatures,path,topbottom) {
    
    if(topbottom=="top"){
        selection = "g.topmap"
    } else {
        selection = "g.bottommap"        
    }

    var lamap = d3.select(selection)
            .selectAll("path")
            .data(geofeatures.features, function (d) {
                return (d.properties.name)
            })

//This will be null. If called in the .then promise below, it's fine.
//console.log("geofeatures?" + geofeatures)
    lamap.enter().append("path")
            .attr("id", function (d, i) {
                return("lsoa_index" + i)
            })
            .attr("class", "leftmap_path")
            .attr("d", path)
            .merge(lamap)
            .style("fill", function (d) {
                if(topbottom=="top"){
                return(top_colours(d.properties.Value))
                } else {
                return(bottom_colours(d.properties.Value))                    
                }
            })

}



function updateSidebar(geofeatures,topbottom) {

    console.log(topbottom)

    if(topbottom=="top"){
        selection = "g#topsidebar"
    } else {
        selection = "g#bottomsidebar"        
    }
    
    console.log(selection)


    var linez = d3.select(selection) 
            .selectAll("line")
            .data(geofeatures.features)


    linez
            .enter()
            .append("line")
            .attr("class", "sidebarline")
            .attr("id", function (d, i) {
//                    window.console.log(i);
                return("lsoaindex" + i)
            })

            .merge(linez)
            .transition()
            .attrs({
                x1: 1,
                y1: function (d) {
                    return(Math.round(sideBarVerticalScale(d.properties.Value)))
                },
                x2: 34,
                y2: function (d) {
                    return(Math.round(sideBarVerticalScale(d.properties.Value)))
                }
            })
            .attr("stroke-width", 2)
            .attr("stroke", function (d) {
                 if(topbottom=="top"){
                return(top_colours(d.properties.Value))
                } else {
                return(bottom_colours(d.properties.Value))                    
                }
            })
//            .attr("stroke-opacity", 0.7)



}




function setName() {

    d3.select("text#nameofla").text(state.zonehoveredover)

}




//function loadTopMapData(laname) {
//
//    //Passed in name will be just LA name.
//    //To match filename, needs spaces replacing with underscores and .geojson stuck on end
//    laname = laname.replace(/ /g, "_")
//
//    laname = "data/localauthorities/" + laname + ".geojson"
//
//    console.log(laname)
//
//    //SETUP FOR LSOA TOP MAP
//    //https://stackoverflow.com/questions/17214293/importing-local-json-file-using-d3-json-does-not-work
//    //D3 5 method 
////    d3.json("data/localauthorities/Sheffield.geojson").then(function (data) {
//    d3.json(laname).then(function (data) {
//
//        //for later use 
//        geofeatures = data
//
//        width = 600
//        height = 400
//
//        //Getting the local authority centred.
//        //https://stackoverflow.com/questions/28141812/d3-geo-responsive-frame-given-a-geojson-object/28142611#28142611
//        //unit projection to start with
//        var projection = d3.geoMercator()
//                .scale(1)
//                .translate([0, 0]);
//        // create a path generator.
//        leftmappath = d3.geoPath()
//                .projection(projection);
//
//        var b = leftmappath.bounds(data),
//                s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
//                t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
//        // Update the projection to use computed scale & translate.
//        projection
//                .scale(s)
//                .translate(t);
//
//        updateTopMap()
//
//        //And with map data, we also need to set lines for its twin sidebar
//        updateSidebarTop()
//
//    });
//
//}


//Attempting refactor to avoid top/bottom code duplication
function loadMapData(laname,topbottom) {

    //Passed in name will be just LA name.
    //To match filename, needs spaces replacing with underscores and .geojson stuck on end
    laname = laname.replace(/ /g, "_")

    laname = "data/localauthorities/" + laname + ".geojson"

    console.log(laname)

    //SETUP FOR LSOA TOP MAP
    //https://stackoverflow.com/questions/17214293/importing-local-json-file-using-d3-json-does-not-work
    //D3 5 method 
//    d3.json("data/localauthorities/Sheffield.geojson").then(function (data) {
    d3.json(laname).then(function (data) {

        //for later use 
        var geofeatures = data

        width = 600
        height = 400

        //Getting the local authority centred.
        //https://stackoverflow.com/questions/28141812/d3-geo-responsive-frame-given-a-geojson-object/28142611#28142611
        //unit projection to start with
        var projection = d3.geoMercator()
                .scale(1)
                .translate([0, 0]);
        // create a path generator.
        var path = d3.geoPath()
                .projection(projection);

        var b = path.bounds(data),
                s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
                t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
        // Update the projection to use computed scale & translate.
        projection
                .scale(s)
                .translate(t);

        updateLocalAuthorityMap(geofeatures,path,topbottom)

        //And with map data, we also need to set lines for its twin sidebar
        updateSidebar(geofeatures,topbottom)

    });

}









function load() {

    console.log("loading")


//    loadTopMapData(state.topmapselection)
    loadMapData(state.topmapselection, "top")
    loadMapData(state.bottommapselection, "bottom")



    //SET UP ENGLAND LA HEXMAP
    d3.json("data/hexmap-lad-england_cleannames.geojson").then(function (data) {


        englandgeofeatures = data

        width = 500
        height = 700

        //Getting the local authority centred.
        //https://stackoverflow.com/questions/28141812/d3-geo-responsive-frame-given-a-geojson-object/28142611#28142611
        //unit projection to start with
        var projection = d3.geoMercator()
                .scale(1)
                .translate([0, 0]);


        // create a path generator.
        //Making this and engmap global to save passing to update function
        ladpath = d3.geoPath()
                .projection(projection);

        var b = ladpath.bounds(data),
                s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
                t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
        // Update the projection to use computed scale & translate.
        projection
                .scale(s)
                .translate(t);


        updateEnglandMap()


        //While we're here, pull out the LA names and set up autocomplete field
        //https://stackoverflow.com/questions/47852270/how-to-extract-value-of-nested-object-array
        var result = englandgeofeatures.features.filter(a => a.properties).reduce((acc, a) => {
            return acc.concat(a.properties)
        }, []).map(a => a.n);

        //https://jqueryui.com/autocomplete/
        //https://stackoverflow.com/questions/19675069/how-to-get-value-of-selected-item-in-autocomplete
        $(function () {
            $("#tags").autocomplete({
                source: result,
                select: function (event, ui) {
                    //alert("You selected: " + ui.item.label);
                    state.topmapselection = ui.item.label

                    //remove prev map
                    d3.selectAll(".leftmap_path")
                            .remove()

                    //make sure any existing lines are removed
                    d3.selectAll(".sidebarline")
                            .remove()


                    loadTopMapData(state.topmapselection)
                }
            });
        });


    });








}



load()

