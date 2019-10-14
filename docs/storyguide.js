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
Here, the maps of Sheffield and Manchester show <a href=\"https://data.gov.uk/dataset/c481f2d3-91fc-4767-ae10-2efdf6d58996/lower-layer-super-output-areas-lsoas\">LSOAs</a>\n\
        (the zones used by the IMD) coloured by deprivation index. \n\
<b>The bars to the right match the map colours</b> - showing exactly where each LSOA is in the IMD rank. \n\
The bars show the full range for England: most deprived zones at the bottom, least deprived at the top. \n\
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
Use the <b>rank/deciles</b> button to <b>switch the bars between rank and decile view</b>. \n\
They're now on deciles: they show Sheffield has 10% of its zones in the top (least deprived) decile\n\
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
        storytext: "<b>The England map shows one of six variables you can select - 'mean' through to 'highest'.</b> Examples of each will follow. \n\
Here, the England map shows <a href=\"https://en.wikipedia.org/wiki/Median\">median</a> IMD per local authority in 2019</b>. \n\
Least deprived places in deeper red are clustered around the west of London.\n\
More deprived are in the North and North-west, though London has a share. \n\
Wokingham & Liverpool (shown here) have the highest & lowest median respectively.\n\
 ",
        year: 2019,
        decile_or_rank: "Rank",
        topmapselection: "Wokingham",
        bottommapselection: "Liverpool",
        hexmapvar: "median",
        difftoggle: ""
    },
    
    {
        menutext: "% in bottom decile: if none, doesn't always mean less deprived",
        storytext: "This England map shows the <b>percent of zones in the most deprived decile</b> for each local authority. \n\
The darkest grey ones have <b>no zones in that decile</b>. There's a clear North-South pattern. \n\
In both 2015 and 2019, <b>Middlesbrough has the highest % of zones in the most deprived decile.</b> \n\
A local authority may still be quite deprived with no zones in the lowest decile. \n\
For example, Lambeth (shown here) has the lowest median IMD while having no 'lowest' zones.",
        year: 2019,
        decile_or_rank: "Decile",
        topmapselection: "Middlesbrough",
        bottommapselection: "Lambeth",
        hexmapvar: "decile1prop",
        difftoggle: ""
    },
    
    {
        menutext: "Change between 2015 & 2019: % bottom decile",
        storytext: "The <b>'diff 15-19'</b> button lets the 6 variables show <b>change between 2015 and 19.</b> \n\
This map shows how the <b>% of zones in the most deprived decile changed.</b>\n\
Again, there is a pattern: places along the NW have seen more zones fall into the lowest decile. \n\
London has many places where zones moved out of it. \n\
<b>Click on 'change year'</b> to see change in Tower Hamlets (-22%) & Oldham (+8%). \n\
Also select 'rank' and then change year: note the opposite movement pattern.\n\
",
        year: 2019,
        decile_or_rank: "Decile",
        topmapselection: "Oldham",
        bottommapselection: "Tower Hamlets",
        hexmapvar: "decile1prop",
        difftoggle: "diff"
    },
    
//    The map colour guide gains a black line showing zero: below this, change was negative between those years. \n\
//Hover over the colour guide to see the lowest and highest values: -22.2% and 7.8%. \n\
    {
        menutext: "Change between 2015 & 2019: mean",
        storytext: "A map of the <b>difference in mean IMD between 2015 & 19</b> is striking. \n\
Again, the North sees many places dropping - but other parts of the country also see falls, including the South-east. \n\
In fact, the largest drop is there, in Tonbridge & Malling. London has strong gains, with Westminster being the largest mean increase in England. \n\
Click <b>'change year'</b> to see how zones in those two moved in opposite directions between 2015 and 19.",
        year: 2019,
        decile_or_rank: "Rank",
        topmapselection: "Tonbridge and Malling",
        bottommapselection: "Westminster",
        hexmapvar: "mean",
        difftoggle: "diff"
    },
    
    {
        menutext: "% top decile",
        storytext: "Places with a high <b>proportion of zones in the least-deprived decile</b> tend to be clustered around the outskirts of London. \n\
Wokingham and Hart, shown here, hold the top two places for both 2015 and 19. \n\
Click <b>rank/decile</b>: this shows more than two thirds of their LSOAs are in the top decile.\n\
Many places in the darkest grey have no zones at all in the least deprived decile. London & the east coast stand out.",
        year: 2019,
        decile_or_rank: "Rank",
        topmapselection: "Wokingham",
        bottommapselection: "Hart",
        hexmapvar: "decile10prop",
        difftoggle: ""
    },
    
    //Also, change to <b>diff 15-19</b>: some places where the top decile proportion dropped the most are in the same areas west of London.\n\
   {
        menutext: "Places with highest 'lowest' (consistently less-deprived places)",
        storytext: "<b>'Lowest'</b> shades the map based on the <b>lowest-ranked zone in each local authority</b>.\n\
A cluster of local authorities west of London have very high 'lowest' LSOAs. \n\
These are more consistently less deprived across the whole local authority. \n\
Hart (top map) has the 'highest lowest' (discounting Isles of Scilly - just one zone). \n\
In contrast, Barking & Dagenham has the 'lowest highest': it is consistently one of the most deprived.",
        year: 2019, 
        decile_or_rank: "Rank",
        topmapselection: "Hart",
        bottommapselection: "Barking and Dagenham",
        hexmapvar: "lowest",
        difftoggle: ""
    },
        
    
    {
        menutext: "Places with lowest 'highest' (consistently more-deprived places)",
        storytext: "<b>'Highest'</b> shades the map based on the <b>highest-ranked zone in each local authority.</b> \n\
The map has many red places because most local authorities have some less-deprived zones. \n\
Whites and greys have fewer less-deprived zones. The two London local authorities shown here - Barking/Dagenham & Hackney - \n\
have the 'lowest highest' in both 2015 & 19: they are consistently more deprived across their whole geography.",
        year: 2019,
        decile_or_rank: "Rank",
        topmapselection: "Barking and Dagenham",
        bottommapselection: "Hackney",
        hexmapvar: "highest",
        difftoggle: ""
    },
    
    {
        menutext: "'Highest' change between 2015-19",
        storytext: "The two local authorities where their <b>'Highest'</b> LSOA changes position the most are \n\
<b>Slough</b> (its highest drops 3161 ranks) and <b>Westminster</b> (its highest rockets up by 5396 ranks). 2015 data is shown here: \n\
click the <b>change year</b> button to see the shift in 2019. Note how much more blue the Westminster map gains, as well as the jump in LSOA position on its bar.",
        year: 2015,
        decile_or_rank: "Rank",
        topmapselection: "Westminster",
        bottommapselection: "Slough",
        hexmapvar: "highest",
        difftoggle: "diff"
    },
    
    
    {
        menutext: "Two most like England as a whole",
        storytext: "<b>Bury</b> and <b>Northumberland</b> have the distinction of being the most representative of England as a whole: \n\
they hold first and second place for all of their deciles being closest to ten percent. Bury is first in 2015, second in 2019, Northumberland vice versa. \n\
Though <b>click on 'rank/deciles'</b>: Bury is a little more patchy in the spread of its LSOAs. \n\
And if you <b>click on 'change year'</b>, you can see plenty of LSOAs changed deciles.",
        year: 2019,
        decile_or_rank: "Decile",
        topmapselection: "Northumberland",
        bottommapselection: "Bury",
        hexmapvar: "median",
        difftoggle: ""
    },
    
    
    {
        menutext: "Mean vs median",
        storytext: "What's the difference between the mean & median? <a href=\"https://blog.datawrapper.de/weekly-chart-income\">This site</a> explains it well, \n\
and these two example local authorities illustrate that in the IMD data. \n\
They have the biggest difference between mean & median - Middlesbrough's mean is higher than its median, Three Rivers vice versa. \n\
The mean is strongly affected by extreme values. In Middlesbrough's case, while 49% of its LSOAs are in the lowest decile,\n\
there are many zones in the other deciles pulling the mean up.",
        year: 2019,
        decile_or_rank: "Decile",
        topmapselection: "Middlesbrough",
        bottommapselection: "Three Rivers",
        hexmapvar: "median",
        difftoggle: ""
    },
    
    
    {
        menutext: "",
        storytext: "If you find any good data stories here, do let me know - either <a href=\"https://twitter.com/DanOlner\">on twitter</a> or email to dan olner at gmail dot com.",
        year: 2019,
        decile_or_rank: "Rank",
        topmapselection: "Brighton and Hove",
        bottommapselection: "York",
        hexmapvar: "median",
        difftoggle: ""
    }
    
    
]


   