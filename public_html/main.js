var state = {
    storyindex: -1, //first use will go to zero and get that. Obv, pass if going backwards
    zonehoveredover: null,
    setwhichmap: "top", //top or bottom
    decile_or_rank: "Rank", //show deciles or exact lines at IMD rank. Use "Decile" and "Rank" to match col names (will have year added to complete col name)
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

var lookat = null
var hexheight = 600

var storyguide_menusub = []//reduced storyguide with items removed where menuitem field is empty

//https://github.com/d3/d3-scale-chromatic
//https://github.com/d3/d3-scale#sequential-scales
//https://observablehq.com/@d3/sequential-scales
//Domain is full England ranks for IMD

//Top and bottom map and matching sidebar colours for individual LSOA rank values
var bottom_colours_rank = d3.scaleSequential(d3.interpolatePRGn).domain([1, 32844]);
var top_colours_rank = d3.scaleSequential(d3.interpolateRdYlBu).domain([1, 32844]);


//Same again, same colour range - but for deciles, so only ten values.
var bottom_colours_decile = d3.scaleSequential(d3.interpolatePRGn).domain([1, 10]);
var top_colours_decile = d3.scaleSequential(d3.interpolateRdYlBu).domain([1, 10]);


//Easier way to return the correct one - just sum the strings to get these indices:
//These are for the top and bottom local authority maps and their matching sidebars
var mapcolours = {
    "topDecile": d3.scaleSequential(d3.interpolateRdYlBu).domain([1, 10]),
    "bottomDecile": d3.scaleSequential(d3.interpolatePRGn).domain([1, 10]),
    "topRank": d3.scaleSequential(d3.interpolateRdYlBu).domain([1, 32844]),
    "bottomRank": d3.scaleSequential(d3.interpolatePRGn).domain([1, 32844])
}


//Get scale range from data when variable selection changes
//Store here
//Set in setEnglandMapColourScale()
var hexmapcolourscale = null
var legendscale = null




//vertical sidebar scale
//least to most deprived over the range of the bar
//Might want to set sidebar up programmatically so can have range in one place
var barsize = 800

var sideBarVerticalScale = d3.scaleLinear().domain([1, 32844]).range([barsize, 0])

//Vertical scale for deciles
//Needs two linear scales
//First defines decile start position (based on index 1-10) 
//10 is least deprived and should be at top
//Top one has to start a tenth away from zero 
var sideBarVerticalScale_DecileStartPos = d3.scaleLinear().domain([1, 10]).range([barsize, barsize / 10])

//Second: inside each decile, the percentage can span up to 100%.
//So each can take up a tenth the bar size. 
//Will be shifted up using the decile index
//We'll SUBTRACT this from the start pos. So we want:
//So sideBarVerticalScale_DecilePercent(0) = 0
//And sideBarVerticalScale_DecilePercent(100) = 80
var sideBarVerticalScale_DecilePercent = d3.scaleLinear().domain([0, 100]).range([0, barsize / 10])









//https://stackoverflow.com/questions/11720141/set-onclick-event-using-script
//Class "button" is actually referring to the map top-down choice buttons. Should maybe change that!
$(".button").click(function () {

    state.setwhichmap = this.value

    if (state.setwhichmap == "top") {
        //adds to class def in html...
        //https://stackoverflow.com/questions/16240892/jquery-change-button-color-onclick
        $(".button").removeClass('buttonselectedtop')
        $(".button").removeClass('buttonselectedbottom')

        //change map text marker
        $('#marker_bottom').attr('cy', '392');
        $('#marker_bottom').attr('id', 'marker_top');


        $(this).addClass('buttonselectedtop');
    } else {
        $(".button").removeClass('buttonselectedtop')
        $(".button").removeClass('buttonselectedbottom')
        $(this).addClass('buttonselectedbottom');

        $('#marker_top').attr('cy', '792');
        $('#marker_top').attr('id', 'marker_bottom');

    }

})


//Hexmap buttons
$(".hexmap").click(function () {

    $(".hexmap").removeClass('buttonselected')
    $(this).addClass('buttonselected');

    state.hexmapvar = this.value

    setEnglandMapColourScale()
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

    setEnglandMapColourScale()
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
    state.year = state.year === "2019" ? "2015" : "2019"
    yearChanged()

})




//decile rank toggle button
$("#decilerank").click(function () {

    state.decile_or_rank = state.decile_or_rank === "Decile" ? "Rank" : "Decile"

    //Sidebars will need clearing
    d3.selectAll(".topsidebarline").remove()
    d3.selectAll(".bottomsidebarline").remove()
    d3.selectAll(".sidebartext").remove()

    updateAllMapsAndSidebars()

})





//KEYPRESSES
//https://stackoverflow.com/a/48855547/5023561
//document.addEventListener("keypress", function onPress(event) {
//    if (event.key === "Y" | event.key === "y") {
//
//        state.year = state.year === "2019" ? "2015" : "2019"
//        yearChanged()
//
//    }
//});




//Load menu items in before attaching click
//Use subset of storyguide - only those with menu items populated:
//remove items where menuitems string is empty
//So D3 can easily populate dropdown and we can avoid having all instruction items in it
//Failed to find a more elegant way!
//But note this pulls out a boolean array that should in theory be easy to filter with, right?
//    var hasmenuitem = storyguide.map(function (d, i) {
//        
//        if(d.menutext ===""){
//            return false
//        } else {
//            return true
//        }
//    });

for (var i = 0; i < storyguide.length; i++) {

    if (storyguide[i].menutext !== "") {
        storyguide_menusub.push(storyguide[i])
    }

}

//https://stackoverflow.com/questions/12923942/d3-js-binding-an-object-to-data-and-appending-for-each-key
var menuitems = d3.select('.dropdown-menu')

menuitems.selectAll('li')
        .data(storyguide_menusub)
        .enter()
        .append('a')
        .attr('class', 'dropdown-item')
        .attr('href', '#')
        .attr('index', function (d, i) {
            return i
        })
        .text(function (d, i) {
            return d.menutext
        })




//Story dropdown menu item listener
//https://stackoverflow.com/questions/40874786/getting-value-from-selected-bootstrap-dropdown-option
$('.dropdown-item').click(function () {

//    console.log($(this).text())
//    console.log($(this).attr("index"))

    state.storyindex = parseInt($(this).attr("index"), 10)

    story(state.storyindex)

});



//Story back / forward buttons
$('#forwardarrow').click(function () {

    //as long as there's another story/guide in the list...
    if (state.storyindex + 1 <= storyguide.length - 1) {

        var previousstoryindex = state.storyindex

        story(++state.storyindex)

        //Check if we moved from 0 to 1
        //Which is 2nd story entry so there's now a first
        //If so, activate back arrow
//        if (state.storyindex == 1 & previousstoryindex == 0) {
//            console.log('ping!')
//            $('#backarrow.arrow_deactivated').addClass('arrow')
//            $('#backarrow.arrow_deactivated').removeClass('arrow_deactivated')
//        } else if (state.storyindex == storyguide.length - 1){
//            //Also check for end of story: make forward arrow grey if so.
//            $('#forwardarrow.arrow').addClass('arrow_deactivated')
//            $('#forwardarrow.arrow_deactivated').removeClass('arrow')




    }

})

//Story back / forward buttons
$('#backarrow').click(function () {

    //Not back beyond zero. index starts at minus 1 when loaded.
    if (state.storyindex - 1 >= 0) {

        story(--state.storyindex)

        //Check if we moved from last to penultimate
        //If so, re-activate forward arrow
//        if (state.storyindex == 1 & previousstoryindex == 0) {
//            console.log('ping!')
//            $('#backarrow.arrow_deactivated').addClass('arrow')
//            $('#backarrow.arrow_deactivated').removeClass('arrow_deactivated')
//        } else if (state.storyindex == storyguide.length - 1){
//            //Also check for end of story: make forward arrow grey if so.
//            $('#forwardarrow.arrow').addClass('arrow_deactivated')
//            $('#forwardarrow.arrow_deactivated').removeClass('arrow')



    }

})


function setEnglandMapColourScale() {

    //Create appropriate scale from min and max of target variable
    //See below for stackoverflow link!
    //Only needs doing once when variable changes


    //Different string depending on if diff or not
    if (state.difftoggle === "diff") {
        var vartoget = state.hexmapvar + state.difftoggle
    } else {
        var vartoget = state.hexmapvar + state.year
    }

    var result = englandgeofeatures.features.filter(a => a.properties).reduce((acc, a) => {
        return acc.concat(a.properties)
    }, []).map(a => a[vartoget]);

    //The decile variables contain markers for displaying as totally black
    //They warp the min/max, so need replacing again with zero here
    //Actually, having seen the result, might just leave those zones as is (so this filtering stage would be unnecessary if I just had those as zero!)
    if (state.hexmapvar === "decile1prop" | state.hexmapvar === "decile10prop") {

        for (var i = 0; i < result.length; i++) {
            if (result[i] == -999999) {
                result[i] = 0
            }
        }

    }


    if (state.difftoggle === "diff") {

        //diff variables are diverging scales with zero at centre
        //https://stackoverflow.com/questions/36608611/why-does-math-min1-2-return-nan
        //Well that's odd! A min finding function that doesn't take an array??
        hexmapcolourscale = d3.scaleDiverging().domain([Math.min.apply(null, result), 0, Math.max.apply(null, result)]).interpolator(d3.interpolatePuOr)

    } else {

        hexmapcolourscale = d3.scaleSequential(d3.interpolateRdGy).domain([Math.max.apply(null, result), Math.min.apply(null, result)]);

    }


    //Recreate colours on legend scale   
    legendscale = d3.scaleLinear().domain([0, 180]).range([Math.min.apply(null, result), Math.max.apply(null, result)])

    drawLegend()



}



function yearChanged() {

//    state.year = state.year === "2019" ? "2015" : "2019"
    setEnglandMapColourScale()
    updateEnglandMap()

    updateAllMapsAndSidebars()

    setYear()

}


function updateAllMapsAndSidebars() {

    updateLocalAuthorityMap(state.topgeofeatures, state.toppath, "top")
    updateLocalAuthorityMap(state.bottomgeofeatures, state.bottompath, "bottom")

    updateSidebar(state.topgeofeatures, "top")
    updateSidebar(state.bottomgeofeatures, "bottom")

}



function drawLegend() {

    //Set of lines across the legend, one per two pixels should do huh?
    //Is currently 180 wide...
    //https://stackoverflow.com/questions/3751520/how-to-generate-sequence-of-numbers-chars-in-javascript
    lines = Array(90).fill().map((v, i) => i)

    //Spaced two pixels apart
    for (var i = 0; i < lines.length; i++) {
        lines[i] *= 2
        lines[i] += 1
    }

    //drop all prev lines first
    d3.select(".legendcontainer")
            .selectAll("line")
            .remove()

    var linez = d3.select(".legendcontainer")
            .selectAll("line")
            .data(lines)


    linez
            .enter()
            .append("line")
            .merge(linez)
            .attrs({
                y1: 1,
                x1: function (d) {
                    return d + 1
                },
                y2: 20,
                x2: function (d) {
                    return d + 1
                }
            })
            .attr("stroke-width", 2)
            .attr("stroke", function (d) {

                //Get colour interpolator based on joined string. Then pass in correct property based on another joined string
                return hexmapcolourscale(legendscale(d))


            })


    //If diff legend, add zero line
    if (state.difftoggle === "diff") {

        //Niiiice
        //https://stackoverflow.com/questions/26172311/invert-scale-function

        d3.select(".legendcontainer")
                .append("line")
                .attrs({
                    y1: 1,
                    x1: legendscale.invert(0),
                    y2: 20,
                    x2: legendscale.invert(0)
                })
                .attr("stroke-width", 1)
                .attr("stroke", "rgb(0,0,0)")
    }


}


function updateEnglandMap() {

    //ladpath is set as global var in map setup

    var engmap = d3.select("g.enghexmap")
            .selectAll("path")
            .data(englandgeofeatures.features, function (d) {
                return (d.properties.n)
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
                    if (state.setwhichmap == "bottom") {
                        return("rgb(0,255,0)")
                    } else if (state.setwhichmap == "top") {
                        return("rgb(0,0,255)")
                    }
                }//else if next is after if(state.hoveredover...

                //set permanent top bottom marker colour
                else if (d.properties.n === state.bottommapselection) {
                    return("rgb(0,255,0)")
                } else if (d.properties.n === state.topmapselection) {
                    return("rgb(0,0,255)")
                } else {

                    //Setting colour scale from the data - variable count getting a bit high to do manually!
                    //Just need to get right variable name
                    if (state.difftoggle === "diff") {
                        return hexmapcolourscale(d.properties[state.hexmapvar + state.difftoggle])
                    } else {
                        return hexmapcolourscale(d.properties[state.hexmapvar + state.year])
                    }

//                    //if showing 2015-19 diff values, don't append year to var name, use diff instead
////                        return(hexmap_summary_colours(d.properties[state.hexmapvar + "diff"]))
//
//                        //Select correct diverging colour scale
//                        return(
//                                diffcolours[state.hexmapvar](d.properties[state.hexmapvar + "diff"])
//                                )
//
//                    } else {
//                        return(hexmap_summary_colours(d.properties[state.hexmapvar + state.year]))
//                    }

                }
            })
            .on("mouseover", function (d) {
                $("#legendhider").removeClass('visible')
                $("#legendhider").addClass('invisible')
                state.zonehoveredover = d.properties.n
                setName()
                updateEnglandMap()
            })
            .on("mouseout", function (d) {
                $("#legendhider").removeClass('invisible')
                $("#legendhider").addClass('visible')

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
            .on("mouseover", function (d) {
                $("#legendhider").removeClass('visible')
                $("#legendhider").addClass('invisible')

            })
            .on("mouseout", function (d) {
                $("#legendhider").removeClass('invisible')
                $("#legendhider").addClass('visible')

            })


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
                return (d.properties.code)
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

                //Get colour interpolator based on joined string. Then pass in correct property based on another joined string
                return mapcolours[topbottom + state.decile_or_rank](d.properties[state.decile_or_rank + state.year])

            })



    var selection = topbottom == "top" ? "#topmapname" : "#bottommapname"

    d3.select(selection).text(
            topbottom == "top" ? state.topmapselection : state.bottommapselection
            )


}



function updateSidebar(geofeatures, topbottom) {


    //If sidebar is showing deciles, pull out decile values
    //Previously made in R. 
    //Will see if it's fast enough, otherwise can do faster messier version


    if (state.decile_or_rank === "Decile") {

        //Pull out IMD rank into single array
        //https://stackoverflow.com/questions/47852270/how-to-extract-value-of-nested-object-array
        var result = geofeatures.features.filter(a => a.properties).reduce((acc, a) => {
            return acc.concat(a.properties)
        }, []).map(a => a["Decile" + state.year]);


//        lookat = geofeatures

        //Get count of unique values
        //https://stackoverflow.com/a/49156466/5023561
        var uniqs = result.reduce((acc, val) => {
            acc[val] = acc[val] === undefined ? 1 : acc[val] += 1;
            return acc;
        }, {});
//        console.log(uniqs)

        //then find as proportion of whole. We have number of LSOAs from geofeatures
        for (var property in uniqs) {
            if (uniqs.hasOwnProperty(property)) {
                uniqs[property] /= geofeatures.features.length
                uniqs[property] *= 100
            }
        }


        //Pull out into array. Need to iterate over - if missing, had no counts
        //So need to set to zero.
        var decileprops = new Array(10)

        //Confusing so take note: the array is normal indexing 0-9.
        //The *object* contains a key for the decile number 1-10. So when using below
        //ADD ONE TO GET DECILE
        //(And subtract here to get correct array assignment)
        for (var i = 1; i < 11; i++) {

            if (typeof uniqs[i] === "undefined") {
                decileprops[i - 1] = 0
            } else {
                decileprops[i - 1] = uniqs[i]
            }
        }

//        lookat = decileprops



        //SET UP DECILE VIZ IN BARS
        var selection = null
        var classpath = null

        if (topbottom == "top") {
//            selection = "#topsidebarrect"
            selection = "g#topsidebar_for_deciles"
            classpath = "topsidebarline"
        } else {
//            selection = "#bottomsidebarrect"
            selection = "g#bottomsidebar_for_deciles"
            classpath = "bottomsidebarline"//keep same so can be removed
        }






        var barz = d3.select(selection)
                .selectAll("rect")
                .data(decileprops)

        barz
                .enter()
                .append("rect")
                .attr("class", classpath)
                .attr("id", function (d, i) {
                    return("decileindex_" + (i + 1))
                })

                .merge(barz)
                .transition()
                .duration(750)


                //The x attribute defines the left position of the rectangle
                //The y attribute defines the top position of the rectangle
                .attrs({
                    "x": 1,
                    "y": function (d, i) {

                        //decile is i+1
                        //y is top left of bar so measures percent
                        //Get starting position first - will need to add to that with index to position
                        //Then SUBTRACT the percent mapped value
                        return sideBarVerticalScale_DecileStartPos(i + 1) - sideBarVerticalScale_DecilePercent(d)

                    },
                    "width": 33,

                    "height": function (d, i) {

                        //Height will take us down to the zero-base of the bar since it started at the top.
                        //Height is relative to y position, obv.
                        return sideBarVerticalScale_DecileStartPos(i + 1) - (sideBarVerticalScale_DecileStartPos(i + 1) - sideBarVerticalScale_DecilePercent(d))

                    }
                })
                .attr("stroke-width", 0)
                .attr("fill", function (d, i) {

                    //decile will be index+1

                    return mapcolours[topbottom + state.decile_or_rank](i + 1)

                })







        //ADD TEXT OF PERCENTAGES
        if (topbottom == "top") {
            selection = "g#topsidebar_for_percenttext"
        } else {
            selection = "g#bottomsidebar_for_percenttext"
        }

//        classpath = "sidebartext"
        classpath = "sidebartext svgtxt"


        var textz = d3.select(selection)
                .selectAll("text")
                .data(decileprops)

        textz
                .enter()
                .append("text")
                .attr("class", classpath)
                .attr("id", function (d, i) {
                    return("textdecileindex_" + (i + 1))
                })

                .merge(textz)
                .text(function (d) {
                    return (Math.round(d) + "%")
                })
                .attr("stroke", 255)
                .attr("fill", "rgb(100,100,100)")
                .attr("font-size", "14px")
                .attr("font-family", "sans-serif")
                .attr("text-anchor", "middle")
                .attrs({
                    "x": 17,
                    "y": function (d, i) {

                        //decile is i+1
                        //y is top left of bar so measures percent
                        //Get starting position first - will need to add to that with index to position
                        //Then SUBTRACT the percent mapped value
                        return sideBarVerticalScale_DecileStartPos(i + 1) - (barsize / 10 / 2)

                    }
                })





    } else {//Show individual rank positions

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
                        return(Math.round(sideBarVerticalScale(d.properties["Rank" + state.year])))
                    },
                    x2: 34,
                    y2: function (d) {
                        return(Math.round(sideBarVerticalScale(d.properties["Rank" + state.year])))
                    }
                })
                .attr("stroke-width", 2)
                .attr("stroke", function (d) {

                    //Get colour interpolator based on joined string. Then pass in correct property based on another joined string
                    return mapcolours[topbottom + state.decile_or_rank](d.properties[state.decile_or_rank + state.year])


//                if (topbottom == "top") {
//                    return(top_colours_rank(d.properties["Rank" + state.year]))
//                } else {
//                    return(bottom_colours_rank(d.properties["Rank" + state.year]))
//                }
                })
//            .attr("stroke-opacity", 0.7)

    }


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

//        lookat = geofeatures

        width = 550
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

            state.topgeofeatures = geofeatures
            state.toppath = path

        } else {

            state.bottomgeofeatures = geofeatures
            state.bottompath = path

        }

    });

}









function load() {

    console.log("loading")



    loadMapData(state.topmapselection, "top")
    loadMapData(state.bottommapselection, "bottom")



    //SET UP ENGLAND LA HEXMAP
//    d3.json("data/hexmap-lad-england_cleannames_w_meanmedianIMD.geojson").then(function (data) {
//    d3.json("data/hexmap-lad-england_cleannames_w_meanmedianIMD_2015diffs.geojson").then(function (data) {
//    d3.json("data/hexmap-lad-england_cleannames_w_meanmedian_n_diffs_2015_2019.geojson").then(function (data) {
    d3.json("data/hexmap-lad-england_cleannames_w_meanmedian_deciles_n_diffs_2015_2019.geojson").then(function (data) {


        englandgeofeatures = data

        width = 500
        height = hexheight

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

        setEnglandMapColourScale()
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
            height = hexheight

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



function story(index) {

//    console.log("story " + index)

    //update arrows to mark start and end of story
    //grey out back or forward if none in those directions
    if (index == 0) {
        $("#backarrow").removeClass();
        $("#backarrow").addClass('arrow_deactivated');
    } else if (index == storyguide.length - 1) {
        $("#forwardarrow").removeClass();
        $("#forwardarrow").addClass('arrow_deactivated');
    } else {
        //otherwise is visible
        $("#forwardarrow").removeClass();
        $("#backarrow").removeClass();
        $("#forwardarrow").addClass('arrow')
        $("#backarrow").addClass('arrow')

    }

    //replace text
    //$(".storytext").text(storyguide[index].storytext);
    //Using replace version so we can have HTML in there.
    $(".storytext").replaceWith("<p class = \"storytext\">" + storyguide[index].storytext + "</p>");

    //Interpret commands
    if (storyguide[index].year != state.year) {

        state.year = storyguide[index].year
        yearChanged()

    }

    //This needs to be first, before maps load. Updating them twice, though?
    //Optimise updates later...
    if (storyguide[index].decile_or_rank !== state.decile_or_rank) {

        state.decile_or_rank = storyguide[index].decile_or_rank

        d3.selectAll(".topsidebarline").remove()
        d3.selectAll(".bottomsidebarline").remove()
        d3.selectAll(".sidebartext").remove()

        updateAllMapsAndSidebars()
        
//        d3.selectAll(".topsidebarline")
//                .remove()
//        d3.selectAll(".bottomsidebarline")
//                .remove()
//        d3.selectAll(".topmap_path")
//                .remove()
//        d3.selectAll(".bottommap_path")
//                .remove()
//
//        d3.selectAll(".sidebartext").remove()

    }






    if (storyguide[index].topmapselection !== state.topmapselection) {

        state.topmapselection = storyguide[index].topmapselection

        d3.selectAll(".topmap_path")
                .remove()

        //make sure any existing lines are removed
        d3.selectAll(".topsidebarline")
                .remove()


        loadMapData(state.topmapselection, "top")
        setEnglandMapColourScale()
        updateEnglandMap()

    }





    if (storyguide[index].bottommapselection !== state.bottommapselection) {

        state.bottommapselection = storyguide[index].bottommapselection

        d3.selectAll(".bottommap_path")
                .remove()

        //make sure any existing lines are removed
        d3.selectAll(".bottomsidebarline")
                .remove()


        loadMapData(state.bottommapselection, "bottom")
        setEnglandMapColourScale()
        updateEnglandMap()

    }




    if (storyguide[index].hexmapvar !== state.hexmapvar) {

        state.hexmapvar = storyguide[index].hexmapvar

        $(".hexmap").removeClass('buttonselected')
        $("#hexmap_" + state.hexmapvar).addClass('buttonselected');
        setEnglandMapColourScale()
        updateEnglandMap()

    }


    if (storyguide[index].difftoggle !== state.difftoggle) {

        state.difftoggle = storyguide[index].difftoggle

        if (state.difftoggle === "diff") {
            $("#difftoggle").addClass('buttonselected')
        } else {
            $("#difftoggle").removeClass('buttonselected')
        }
        setEnglandMapColourScale()
        updateEnglandMap()

    }





}
















load()

