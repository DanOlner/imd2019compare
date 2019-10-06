var state = {
    zonehoveredover: null,
    setwhichmap: "top", //top or bottom
    topmapselection: "Sheffield",
    bottommapselection: "Manchester",
    hexmapvar: "median",
    difftoggle: "", //Will be "diff" or "" - slightly tricky as if "diff", don't append year to column name
    year: "2019",
    bottomgeofeatures: null,
    topgeofeatures: null,
    bottompath: null,
    toppath: null//These four above copied in the first topbottom check in loadMapData so year change can update correctly
}

//Ranges for the diff variables for the hex map (for making correct colour range / splitting at zero)
//var diffranges = {
//    meandiff: {
//        min: -1619.75,
//        max: 4578.32
//    },
//    mediandiff: {
//        min: -2690,
//        max: 4334.5
//    },
//    lowestdiff: {
//        min: -4605,
//        max: 2974
//    },
//    highestdiff: {
//        min: -3161,
//        max: 5396
//    }
//    }


//https://github.com/d3/d3-scale-chromatic
//https://github.com/d3/d3-scale#sequential-scales
//https://observablehq.com/@d3/sequential-scales
//Domain is full England ranks for IMD
//var bottom_colours = d3.scaleSequential(d3.interpolatePiYG).domain([1,32844]);
//var bottom_colours = d3.scaleSequential(d3.interpolateBrBG).domain([1,32844]);
var bottom_colours = d3.scaleSequential(d3.interpolatePRGn).domain([1, 32844]);
var top_colours = d3.scaleSequential(d3.interpolateRdYlBu).domain([1, 32844]);
//var region_colours = d3.scaleSequential(d3.interpolateSinebow).domain([1, 9]);

//Nine regions: 18 to 1 so actual values only half the scale, not into too light greens
var region_colours = d3.scaleSequential(d3.interpolateGreens).domain([18, 1]);

//Now using IMD rank values - mean per local authority
//var LA_IMDmean_colours = d3.scaleSequential(d3.interpolateCubehelixDefault).domain([1,32844]);
var hexmap_summary_colours = d3.scaleSequential(d3.interpolateRdGy).domain([32844, 1]);
//var hexmap_summary_colours = d3.scaleSequential(d3.interpolateGreens).domain([1,32844]);


//Bespoke ranges for the four 2015-19 differences.
//Using diverging scales.
//https://observablehq.com/@d3/diverging-scales
var diffcolours = {
    mean: d3.scaleDiverging()
            .domain([-1619.75, 0, 4578.32])
            .interpolator(d3.interpolatePuOr),
    median: d3.scaleDiverging()
            .domain([-2690, 0, 4334.5])
            .interpolator(d3.interpolatePuOr),
    lowest: d3.scaleDiverging()
            .domain([-4605, 0, 2974])
            .interpolator(d3.interpolatePuOr),
    highest: d3.scaleDiverging()
            .domain([-3161, 0, 5396])
            .interpolator(d3.interpolatePuOr)
}


//vertical sidebar scale
//least to most deprived over the range of the bar
//Might want to set sidebar up programmatically so can have range in one place
var sideBarVerticalScale = d3.scaleLinear().domain([1, 32844]).range([800, 0])




//https://stackoverflow.com/questions/11720141/set-onclick-event-using-script
//Class "button" is actually referring to the map top-down choice buttons. Should maybe change that!
$(".button").click(function () {

    state.setwhichmap = this.value

    if (state.setwhichmap == "top") {
        //adds to class def in html...
        //https://stackoverflow.com/questions/16240892/jquery-change-button-color-onclick
        $(".button").removeClass('buttonselectedtop')
        $(".button").removeClass('buttonselectedbottom')
        $(this).addClass('buttonselectedtop');
    } else {
        $(".button").removeClass('buttonselectedtop')
        $(".button").removeClass('buttonselectedbottom')
        $(this).addClass('buttonselectedbottom');
    }

})


//Hexmap buttons
$(".hexmap").click(function () {

    $(".hexmap").removeClass('buttonselected')
    $(this).addClass('buttonselected');

    state.hexmapvar = this.value
    updateEnglandMap()

})

//Hexmap diff toggle button
$("#difftoggle").click(function () {

    if (state.difftoggle == "diff") {

        state.difftoggle = ""
        $(this).removeClass('buttonselected')

    } else {

        state.difftoggle = "diff"
        $(this).addClass('buttonselected')

    }

    updateEnglandMap()

})


//year toggle button
$("#yearbutton").click(function () {
    
//    console.log("badgers!")
//
//    if (state.year === "2019") {
//
//        state.year = "2015"
//
//    } else {
//
//        state.year = "2019"
//
//    }
//    
    yearChanged()
    
})





//KEYPRESSES
//https://stackoverflow.com/a/48855547/5023561
document.addEventListener("keypress", function onPress(event) {
    if (event.key === "Y" | event.key === "y") {

        yearChanged()

    }
});



function yearChanged() {

    state.year = state.year === "2019" ? "2015" : "2019"
    updateEnglandMap()

    updateLocalAuthorityMap(state.topgeofeatures, state.toppath, "top")
    updateLocalAuthorityMap(state.bottomgeofeatures, state.bottompath, "bottom")

    updateSidebar(state.topgeofeatures, "top")
    updateSidebar(state.bottomgeofeatures, "bottom")

    setYear()

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

                    //Have hover colour match the top bottom colour
                    //Some horrible nesting going on here, careful
                    if (state.setwhichmap == "top") {
                        return("rgb(0,255,0)")
                    } else if (state.setwhichmap == "bottom") {
                        return("rgb(0,0,255)")
                    }
                }//else if next is after if(state.hoveredover...

                //set permanent top bottom marker colour
                else if (d.properties.n === state.topmapselection) {
                    return("rgb(0,255,0)")
                } else if (d.properties.n === state.bottommapselection) {
                    return("rgb(0,0,255)")
                } else {

                    //if showing 2015-19 diff values, don't append year to var name, use diff instead
                    if (state.difftoggle === "diff") {
//                        return(hexmap_summary_colours(d.properties[state.hexmapvar + "diff"]))

                        //Select correct diverging colour scale
                        return(
                                diffcolours[state.hexmapvar](d.properties[state.hexmapvar + "diff"])
                                )

                    } else {
                        return(hexmap_summary_colours(d.properties[state.hexmapvar + state.year]))
                    }

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

                if (state.setwhichmap == "top") {

                    state.topmapselection = d.properties.n

                    //remove prev map
                    d3.selectAll(".topmap_path")
                            .remove()

                    //make sure any existing lines are removed
                    d3.selectAll(".topsidebarline")
                            .remove()

                } else {

                    state.bottommapselection = d.properties.n

                    //remove prev map
                    d3.selectAll(".bottommap_path")
                            .remove()

                    //make sure any existing lines are removed
                    d3.selectAll(".bottomsidebarline")
                            .remove()

                }

                loadMapData(d.properties.n, state.setwhichmap)

            })

    setYear()

}



function updateOverlayMap() {

    var overlaymap = d3.select("g.overlayhexmap")
            .selectAll("path")
            .data(overlaygeofeatures.features, function (d) {
                return (d.properties.g)
            })

    overlaymap.enter().append("path")
            .attr("id", function (d, i) {
                return("overlay_index" + i)
            })
            .attr("d", overlaypath)
            .attr("class", "overlay_path")
            .merge(overlaymap)


}





//Can update this to work for both, right? Maybe?
function updateLocalAuthorityMap(geofeatures, path, topbottom) {


    var selection = null
    var classpath = null

    if (topbottom == "top") {
        selection = "g.topmap"
        classpath = "topmap_path"

    } else {
        selection = "g.bottommap"
        classpath = "bottommap_path"
    }

    var lamap = d3.select(selection)
            .selectAll("path")
            .data(geofeatures.features, function (d) {
                return (d.properties.name)
            })

    lamap.enter().append("path")
            .attr("id", function (d, i) {
                return("lsoa_index" + i)
            })
            .attr("class", classpath)
            .attr("d", path)
            .merge(lamap)
            .transition()
            .duration(750)
            .style("fill", function (d) {
                if (topbottom == "top") {
                    return(top_colours(d.properties["Value" + state.year]))
                } else {
                    return(bottom_colours(d.properties["Value" + state.year]))
                }
            })


    //set map names (do that here so it draws after map)
    //Though I can't for the life of me get that to work...

    //Add programmatically so it comes after/on top of map SVG elements
    //<text id = "topmapname" x ="100" y="400" font-size="25px" fill="black" fill-opacity="0.7" text-anchor="left"></text>
//    var selection = topbottom == "top" ? "#topmap" : "#bottommap"
//    
//    d3.select(selection)
//            .selectAll("text")
//            .enter()
//            .append("text")
//            .text("check")
//            .attr("x", 100)
//            .attr("y", 400)//this should be relative to parent g...
//            .attr("font-size","25px")
//            .attr("fill","black")
//            .attr("fill-opacity",0.7)
//            .attr("tex-anchor","left")
//            


    var selection = topbottom == "top" ? "#topmapname" : "#bottommapname"

    d3.select(selection).text(
            topbottom == "top" ? state.topmapselection : state.bottommapselection
            )


}



function updateSidebar(geofeatures, topbottom) {

    var selection = null
    var classpath = null

    if (topbottom == "top") {
        selection = "g#topsidebar"
        classpath = "topsidebarline"
    } else {
        selection = "g#bottomsidebar"
        classpath = "bottomsidebarline"
    }


    var linez = d3.select(selection)
            .selectAll("line")
            .data(geofeatures.features)


    linez
            .enter()
            .append("line")
            .attr("class", classpath)
            .attr("id", function (d, i) {
//                    window.console.log(i);
                return("lsoaindex" + i)
            })

            .merge(linez)
            .transition()
            .duration(750)
            .attrs({
                x1: 1,
                y1: function (d) {
                    return(Math.round(sideBarVerticalScale(d.properties["Value" + state.year])))
                },
                x2: 34,
                y2: function (d) {
                    return(Math.round(sideBarVerticalScale(d.properties["Value" + state.year])))
                }
            })
            .attr("stroke-width", 2)
            .attr("stroke", function (d) {
                if (topbottom == "top") {
                    return(top_colours(d.properties["Value" + state.year]))
                } else {
                    return(bottom_colours(d.properties["Value" + state.year]))
                }
            })
//            .attr("stroke-opacity", 0.7)


}




function setName() {

    d3.select("text#nameofla").text(state.zonehoveredover)

}


function setYear() {

    d3.select("text#year").text(state.year)

}







//Attempting refactor to avoid top/bottom code duplication
function loadMapData(laname, topbottom) {

    //Passed in name will be just LA name.
    //To match filename, needs spaces replacing with underscores and .geojson stuck on end
    laname = laname.replace(/ /g, "_")

    laname = "data/localauthorities/" + laname + ".geojson"

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

        updateLocalAuthorityMap(geofeatures, path, topbottom)

        //And with map data, we also need to set lines for its twin sidebar
        updateSidebar(geofeatures, topbottom)

        //Set state for bottom and top geofeatures and paths so they can be used when year changes
        if (topbottom === "top") {

            console.log("top")

            state.topgeofeatures = geofeatures
            state.toppath = path

        } else {

            console.log("bottom")

            state.bottomgeofeatures = geofeatures
            state.bottompath = path

        }

    });

}









function load() {

    console.log("loading")


//    loadTopMapData(state.topmapselection)
    loadMapData(state.topmapselection, "top")
    loadMapData(state.bottommapselection, "bottom")



    //SET UP ENGLAND LA HEXMAP
//    d3.json("data/hexmap-lad-england_cleannames_w_meanmedianIMD.geojson").then(function (data) {
//    d3.json("data/hexmap-lad-england_cleannames_w_meanmedianIMD_2015diffs.geojson").then(function (data) {
    d3.json("data/hexmap-lad-england_cleannames_w_meanmedian_n_diffs_2015_2019.geojson").then(function (data) {


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

                    //Set either bottom or top map
                    if (state.setwhichmap == "top") {

                        state.topmapselection = ui.item.label

                        //remove prev map
                        d3.selectAll(".topmap_path")
                                .remove()

                        //make sure any existing lines are removed
                        d3.selectAll(".topsidebarline")
                                .remove()

                    } else {

                        state.bottommapselection = ui.item.label

                        //remove prev map
                        d3.selectAll(".bottommap_path")
                                .remove()

                        //make sure any existing lines are removed
                        d3.selectAll(".bottomsidebarline")
                                .remove()

                    }

                    loadMapData(ui.item.label, state.setwhichmap)

                    //Also need to rerun hexmap to change marker of where LA is
                    updateEnglandMap()

                }
            });
        });



        //Set up region hex overlay here so it draws in the right order
        d3.json("data/hexmap_regions.geojson").then(function (data) {

            overlaygeofeatures = data

            width = 500
            height = 700

            //All the same code as for main map
            //https://stackoverflow.com/questions/28141812/d3-geo-responsive-frame-given-a-geojson-object/28142611#28142611
            //unit projection to start with
            var projection = d3.geoMercator()
                    .scale(1)
                    .translate([0, 0]);


            // create a path generator.
            //Making this and engmap global to save passing to update function
            overlaypath = d3.geoPath()
                    .projection(projection);

            var b = overlaypath.bounds(data),
                    s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
                    t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
            // Update the projection to use computed scale & translate.
            projection
                    .scale(s)
                    .translate(t);


            updateOverlayMap()

        });





    });








}



load()

