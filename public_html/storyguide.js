//These are the things that need to change
//Year
//topmapselection
//bottommapselection
//hexmapvar: ("median" etc)
//difftoggle: "diff" or ""

//Set to null if no change


var storyguide = [
    
    {
        menutext: "Instructions start",
        storytext: "You can <b>compare two local authorities side by side.</b> \n\
Here, the maps of Sheffield and Manchester show LSOAs (the zones used by the IMD) coloured by deprivation index. \n\
The bars to the right match the map colours - showing exactly where each LSOA is in the IMD rank. \n\
The bars capture the full index range for England: most deprived zones at the bottom, least deprived at the top. \n\
<b>Sheffield has an even spread, Manchester has far fewer 'least deprived' zones.</b>",
        year: 2019,
        decile_or_rank: "Rank",
        topmapselection: "Sheffield",
        bottommapselection: "Manchester",
        hexmapvar: "median",
        difftoggle: ""
    },
    {
        menutext: "",
        storytext: "<b>Select a new local authority</b> either by <b>finding it on the England map</b> or <b>typing a part of its name</b> in the autocomplete box at the top. \n\
To choose which map to change, use the <b>set bottom and top map</b> buttons.\n\
Use the <b>rank/deciles</b> button to switch the bars between rank and decile view. \n\
They're now on deciles: they show Sheffield has 19% of its zones in the top two (least deprived) deciles\n\
while Manchester has none.",
        year: 2019,
        decile_or_rank: "Decile",
        topmapselection: "Sheffield",
        bottommapselection: "Manchester",
        hexmapvar: "median",
        difftoggle: ""
    },
    {
        menutext: "Highest & lowest median IMD 2019",
        storytext: "<b>The England map shows one of six variables you can select - mean through to highest.</b> Examples of each will follow. \n\
Here, the England map shows <a href=\"https://en.wikipedia.org/wiki/Median\">median</a> IMD per local authority in 2019</b>. \n\
High values in deeper red are clustered around the west of London.\n\
Wokingham has the highest median, Liverpool the lowest.\n\
 ",
        year: 2019,
        decile_or_rank: "Rank",
        topmapselection: "Wokingham",
        bottommapselection: "Liverpool",
        hexmapvar: "median",
        difftoggle: ""
    },
    
    {
        menutext: "pos/neg",
        storytext: "The England map can show 4 different values: mean, median, highest and lowest. 'Highest' (shown here) means 'the zone with the highest IMD rank in that LA' and 'lowest'\n\
vice versa. These two maps show the two LAs where the highest zone changed the most between 2015-19. <b>Click on 'change year' to see.</b>\n\
Note those two white zones on the England map in NE London. Click on one of them...",
        year: 2019,
        topmapselection: "Westminster",
        bottommapselection: "Slough",
        hexmapvar: "highest",
        difftoggle: ""
    },
    {
        menutext: "LAs with lowest 'highest' (shows consistently more deprived places)",
        storytext: "Hopefully you clicked on Barking/Dagenham or Hackney. Here we can see, their highest-ranked LSOAs are near the middle of the rankings. \n\
In fact, Barking/Dagenham has the 'lowest highest' in 2019, Hackney the same for 2015. In contrast, most places (especially the deep red ones on the England map) have at least some LSOAs\n\
near the top of the least-deprived end of the rank.",
        year: 2019,
        topmapselection: "Barking and Dagenham",
        bottommapselection: "Hackney",
        hexmapvar: "highest",
        difftoggle: ""
    },
    {
        menutext: "LAs with highest 'lowest' (shows consistently less-deprived places)",
        storytext: "'Highest' is effective for seeing where is overall more deprived: places where all LSOAs are in the more-deprived ranks. \n\
'Lowest' shows the reverse: for example, Hart (bottom map) has the 'highest lowest' (discounting Isles of Scilly - just one zone). \n\
It is consistently less-deprived across the whole local authority.",
        year: 2019,
        topmapselection: "Barking and Dagenham",
        bottommapselection: "Hart",
        hexmapvar: "lowest",
        difftoggle: ""
    },
    {
        menutext: "Highest example",
        storytext: "<b>\"Highest\"</b> colours the map based on the highest-ranked zone in each local authority. \n\
    Darker reds all have plenty in the least-deprived decile. As the colours become pinker, \n\
    the \"highest\" becomes lower - many lighter ones have no zones in the least deprived decile, as shown here on opposite sides of the country.",
        year: 2019,
        topmapselection: "Fenland",
        bottommapselection: "West Somerset",
        hexmapvar: "highest",
        difftoggle: ""
    },
    {
        menutext: "Badgers2",
        storytext: "Armpits and other things of that nature",
        year: 2015,
        topmapselection: "Nuneaton and Bedworth",
        bottommapselection: "Wokingham",
        hexmapvar: "mean",
        difftoggle: "diff"
    }
    
]

