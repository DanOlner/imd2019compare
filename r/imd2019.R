library(tidyverse)
library(sf)
library(spdep)
library(geogrid)
library(pryr)
library(tmap)


#Full IMD data in long form
#From https://www.gov.uk/guidance/english-indices-of-deprivation-2019-mapping-resources
#Open data communities link
imd2019 <- read_csv('data/imd2019lsoa.csv')

#Drop score measure
imd2019 <- imd2019 %>% filter(Measurement %in% c('Rank','Decile')

#What domains do we have? (Order alphabetically)
unique(imd2019$`Indices of Deprivation`)[order(unique(imd2019$`Indices of Deprivation`))]

#Use only full index of multiple deprivation and rank. Takes us down to 32844 rows - one per LSOA
imd2019.rank <- imd2019 %>% filter(Measurement == 'Rank', `Indices of Deprivation` == 'a. Index of Multiple Deprivation (IMD)')



#~~~~~~~~~~~~~~~~~~~~~
#PREPARE GEOGRAPHY----
#~~~~~~~~~~~~~~~~~~~~~

# via https://borders.ukdataservice.ac.uk
lsoas <- st_read('data/England_lsoa_2011_gen_clipped/england_lsoa_2011_gen_clipped.shp')

#Check LSOA codes match. Tick, all true.
table(imd2019.rank$FeatureCode %in% lsoas$code)


#LSOA / LAD lookup.
#via https://geoportal.statistics.gov.uk/datasets/output-area-to-lsoa-to-msoa-to-local-authority-district-december-2017-lookup-with-area-classifications-in-great-britain/data
lookup <- read_csv('data/Output_Area_to_Lower_Layer_Super_Output_Area_to_Middle_Layer_Super_Output_Area_to_Local_Authority_District_December_2017_Lookup_in_Great_Britain__Classification_Version_2.csv')

#Attach local authority codes/names to LSOAs
#(Could use other lookup geographies / categories but just want this for now)

#First: only want unique LSOAs, not lower-level geographies
#So just keep unique LSOAs in lookup
lookup <- lookup %>%
  select(LSOA11CD,LAD17CD,LAD17NM) %>% 
  distinct()

#The lookup covers Great Britain so we get more LSOAs
#Left join to England LSOAs just to keep English LADs

#Before doing that, check all the English LSOAs are in the lookup file... tick.
table(lsoas$code %in% lookup$LSOA11CD)

lsoas <- lsoas %>% 
  left_join(lookup, by = c('code' = 'LSOA11CD'))


#326? Should be 317?
length(unique(lsoas$LAD17NM))

#Spread of number of LSOAs per LAD
lsoas.per.lad <- lsoas %>% 
  st_set_geometry(NULL) %>% 
  group_by(LAD17CD) %>% 
  summarise(count = n(), name = max(LAD17NM)) 

ggplot(lsoas.per.lad,aes(x = count)) +
  geom_density()

mean(lsoas.per.lad$count)
median(lsoas.per.lad$count)
range(lsoas.per.lad$count)

#Where the hell has one?? Oh, Isle of Scilly.


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#JOIN IMD TO LSOA DATA WITH LAD CODES----
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

#Do the join onto the geographical data so we keep the geo part
imd2019.rank.geo <- lsoas %>% left_join(imd2019.rank, by = c('code' = 'FeatureCode'))

#All
imd2019.geo <- lsoas %>% left_join(imd2019, by = c('code' = 'FeatureCode'))

#save, takes a while to run. 116mb
saveRDS(imd2019.geo, 'data/imd2019geo.rds')



#~~~~~~~~~~~~
#Save an example for using in D3----
#~~~~~~~~~~~~

#remove some unnecessary fields once filtered
shef <- imd2019.geo %>% 
  filter( grepl(pattern = 'sheffield', ignore.case = T, x = .$LAD17NM) ) %>% 
  filter(Measurement=='Rank',`Indices of Deprivation` == 'a. Index of Multiple Deprivation (IMD)') %>% 
  select(name,code,Value)

#Project to latlon
shef <- st_transform(shef,4326)#I think that's the right EPSG code!

#save as geojson
st_write(shef,"misc/sheflsoas.geojson")

#save single zone for testing
#st_write(shef[1,],"misc/sheflsoas_singlezone.geojson")




kens <- imd2019.geo %>% 
  filter( grepl(pattern = 'kensington', ignore.case = T, x = .$LAD17NM) ) %>% 
  filter(Measurement=='Rank',`Indices of Deprivation` == 'a. Index of Multiple Deprivation (IMD)') %>% 
  select(name,code,Value)

#Project to latlon
kens <- st_transform(kens,4326)#I think that's the right EPSG code!

#save as geojson
st_write(kens,"misc/kens_n_chelsea_lsoas.geojson")


boston <- imd2019.geo %>% 
  filter( grepl(pattern = 'boston', ignore.case = T, x = .$LAD17NM) ) %>% 
  filter(Measurement=='Rank',`Indices of Deprivation` == 'a. Index of Multiple Deprivation (IMD)') %>% 
  select(name,code,Value)

#Project to latlon
boston <- st_transform(boston,4326)#I think that's the right EPSG code!

#save as geojson
st_write(boston,"misc/boston.geojson")



birm <- imd2019.geo %>% 
  filter( grepl(pattern = 'birmingham', ignore.case = T, x = .$LAD17NM) ) %>% 
  filter(Measurement=='Rank',`Indices of Deprivation` == 'a. Index of Multiple Deprivation (IMD)') %>% 
  select(name,code,Value)

#Project to latlon
birm <- st_transform(birm,4326)#I think that's the right EPSG code!

#save as geojson
st_write(birm,"C:/Users/admin/Dropbox/WWWdev/D3_imd2019/imd2019compare/public_html/data/birmingham.geojson")



#~~~~~~~~~~~~
#Save every local authority for using in D3----
#~~~~~~~~~~~~


imd2019.geo <- readRDS('data/imd2019geo.rds')

#Luckily, all names match in the hexmap and data. Nice.
# table(hexmap.eng$n %in% unique(imd2019.geo$LAD17NM))


#https://stackoverflow.com/questions/10294284/remove-all-special-characters-from-a-string-in-r
#https://stackoverflow.com/questions/29403080/match-and-replace-multiple-strings-in-a-vector-of-text-without-looping-in-r?rq=1
# stringr::str_replace_all(hexmap.eng$n, "[[:punct:]]", " ")

#actually, doing this directly with hexmap 2 below. Getting messy!!
#hexmap.eng.cleannames <- hexmap.eng
#hexmap.eng.cleannames$n <- stringr::str_replace_all(hexmap.eng$n, "[[:punct:]]", " ")

imd2019.geo.cleannames <- imd2019.geo
imd2019.geo.cleannames$LAD17NM <- stringr::str_replace_all(imd2019.geo.cleannames$LAD17NM, "[[:punct:]]", " ")


#Get 2015 IMD values
imd2015 <- read_csv('data/File_7_ID_2015_All_ranks__deciles_and_scores_for_the_Indices_of_Deprivation__and_population_denominators.csv')

#Update names - using LSOA for merge so match name
imd2015 <- imd2015 %>% 
  select(code = `LSOA code (2011)`,
         Rank2015 = `Index of Multiple Deprivation (IMD) Rank (where 1 is most deprived)`,
         Decile2015 = `Index of Multiple Deprivation (IMD) Decile (where 1 is most deprived 10% of LSOAs)`)

# imd2015$LAD17NM <- stringr::str_replace_all(imd2015$LAD17NM, "[[:punct:]]", " ")


#check LSOA match in 2019 data. Tick.
table(imd2019.geo.cleannames$code %in% imd2015$code)

#Change 2019 Value name to mark year
imd2019.geo.cleannames <- imd2019.geo.cleannames %>% 
  rename(Value2019 = Value)



#For 2019, keep rank and decile fields, make those wide, one column each plz
#And just keep main IMD index
imd2019.geo.cleannames <- imd2019.geo.cleannames %>% 
  filter(Measurement %in% c('Rank','Decile'),
         `Indices of Deprivation` == 'a. Index of Multiple Deprivation (IMD)') %>% 
  select(code,LAD17NM,Measurement,Value2019)

  
imd2019.geo.cleannames <- imd2019.geo.cleannames %>% 
  spread(key = Measurement, value = Value2019)


#Check geography worked then... yup, looks OK. Count is right too.
qtm(imd2019.geo.cleannames %>% filter(LAD17NM == "Sheffield"),fill = "Decile")


#Name change to mark 2019
imd2019.geo.cleannames <- imd2019.geo.cleannames %>% 
  rename(Decile2019 = Decile, Rank2019 = Rank)

#All good? Tick.
names(imd2015)
names(imd2019.geo.cleannames)


#Merge in 2015 data.
#On LSOA, numpty!
imd2019.geo.cleannames <- imd2019.geo.cleannames %>% 
  left_join(imd2015, by = "code")


saveRDS(imd2019.geo.cleannames,'data/imd2015_2019_priorToSeparatingByLA.rds')


#Use clean name version, save directly to D3 folder
for(i in unique(imd2019.geo.cleannames$LAD17NM)){
  
  la <- imd2019.geo.cleannames %>% 
    filter(LAD17NM == i)
  
  #Project to latlon
  la <- st_transform(la,4326)
  
  #filename is LA with spaces replaced with underscores
  filename <- stringr::str_replace_all(i, " ", "_")
  
  #save as geojson
  st_write(la,
           paste0("C:/Users/admin/Dropbox/WWWdev/D3_imd2019/imd2019compare/public_html/data/localauthorities/",
                  filename,".geojson"))
  
}



#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#HIGHEST LOWEST DECILE CHANGES BETWEEN YEARS----
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

imd2019.geo <- readRDS('data/imd2015_2019_priorToSeparatingByLA.rds') %>% st_set_geometry(NULL)

#Drop rank, make decile long, group by that and LA, count
imd2019.geo <- imd2019.geo %>% 
  select(-code,-Rank2015,-Rank2019)


imd2019.geo <- imd2019.geo %>% 
  gather(key = decile, value = value, Decile2019:Decile2015)


imd2019.geo <- imd2019.geo %>% 
  group_by(LAD17NM,decile,value) %>% 
  summarise(count = n()) 

#Reload to get LA zone count, merge back in
LAzonecount <- readRDS('data/imd2015_2019_priorToSeparatingByLA.rds') %>%
  st_set_geometry(NULL) %>% 
  group_by(LAD17NM) %>% 
  summarise(LAcount = n())


imd2019.geo <- imd2019.geo %>% 
  left_join(LAzonecount, by = "LAD17NM")


imd2019.geo <- imd2019.geo %>% 
  mutate(decileprop = (count/LAcount)*100)


#While we're here: find LAs with largest proportions in highest and lowest
#In both years
ten2015 <- imd2019.geo %>% 
  filter(decile=="Decile2015",value==10)
ten2019 <- imd2019.geo %>% 
  filter(decile=="Decile2019",value==10)
one2015 <- imd2019.geo %>% 
  filter(decile=="Decile2015",value==1)
one2019 <- imd2019.geo %>% 
  filter(decile=="Decile2019",value==1)


#I'd quite like to see those on a map, some of them.
mapz <- st_read('C:/Data/MapPolygons/England/2011/England_lad_2011_gen_clipped/England_lad_2011_gen_clipped.shp')

mapz$NAME <- stringr::str_replace_all(mapz$NAME, "[[:punct:]]", " ")

table(one$LAD17NM %in% mapz$NAME)
  
mapz <- mapz %>% 
  left_join(one %>% rename(diffinfirstdecile=diff),by = c("NAME" = "LAD17NM"))
mapz <- mapz %>% 
  left_join(ten %>% rename(diffintenthdecile=diff),by = c("NAME" = "LAD17NM"))

tmap_mode('view')
qtm(mapz,fill = 'diffintenthdecile')




#I am not finding a simple way to subtract groups. So.
diff1 <- imd2019.geo %>% 
  select(-count,-LAcount)


#Argh. Going to do manually cos brain is mush
diff2015 <- diff1 %>% 
  ungroup() %>% 
  filter(decile=="Decile2015") %>% 
  select(-decile, decile = value, decileprop2015 = decileprop)


diff2019 <- diff1 %>% 
  ungroup() %>% 
  filter(decile=="Decile2019") %>% 
  select(-decile, decile = value, decileprop2019 = decileprop)
  

both <- left_join(
  diff2015,diff2019,by=c("decile","LAD17NM")  
)

#Some NAs must be zeros. I think.
table(is.na(both$decileprop2015))
table(is.na(both$decileprop2019))

both$decileprop2019[is.na(both$decileprop2019)] <- 0


#difference!
both$diff = both$decileprop2019-both$decileprop2015

saveRDS(both,'data/decilediffs.rds')


#biggest diffs in highest and lowest deciles?
one <- both %>% filter(decile==1)
ten <- both %>% filter(decile==10)




#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#GEOGRID ENGLISH LOCAL AUTHORITY DISTRICTS----
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

#Might as well do most recent rather than arsing about. 
#But the open data platform is still showing 326
#https://opendatacommunities.org/data/local-authorities

#I did see that some were being combined
#Hah: this says 343! https://www.gov.uk/guidance/local-government-structure-and-elections

#OK, sticking to 326 for now, too much faff.
las <- st_read('C:/Data/MapPolygons/England/2011/England_lad_2011_gen_clipped/England_lad_2011_gen_clipped.shp')

#https://github.com/jbaileyh/geogrid
#sets plot parameters
par(mfrow = c(2, 5), mar = c(0, 0, 2, 0))
for (i in 1:10) {
  print(i)
  new_cells <- calculate_grid(shape = las, grid_type = "hexagonal", seed = i)
  plot(new_cells, main = paste("Seed", i, sep = " "))
}

#Let's go for seed 3
new_cells <- calculate_grid(shape = las, grid_type = "hexagonal", seed = 3)

#This takes a little while to run! You'd have thought this stage was the easiest...
#Now taking a REALLY REALLY long time.
#Ah, actually no: this is doing a lot of the grunt work.
resulthex <- assign_polygons(las, new_cells)

#It's tiny as well. That took maybe 20 minutes. Odd.
saveRDS(resulthex,'data/localauthorityhexmap.rds')

#Does it work? Appears to.
par(mfrow = c(1, 1), mar = c(0, 0, 2, 0))
plot(st_geometry(resulthex))

#Newp! Wrong relative locations.
plot(st_geometry(resulthex[grepl(pattern = 'Sheffield',x = resulthex$NAME),]), add=T, col='RED')
plot(st_geometry(resulthex[grepl(pattern = 'Leeds',x = resulthex$NAME),]), add=T, col='BLUE')
plot(st_geometry(resulthex[grepl(pattern = 'Wakefield',x = resulthex$NAME),]), add=T, col='GREEN')

plot(st_geometry(resulthex[resulthex$NAME=='York',]), add=T, col='GREEN')
plot(st_geometry(resulthex[resulthex$NAME=='Manchester',]), add=T, col='RED')

resulthex$NAME[grepl(pattern = 'York',x = resulthex$NAME)]
resulthex$NAME[grepl(pattern = 'Leeds',x = resulthex$NAME)]



#Is there a way of checking which are the most out of line and just correcting?
#So - get relative positions for neighbours from the original

la.neighbours <- poly2nb(as(las,'Spatial'))

la.neighbours[[which(las$NAME=='Leeds')]]
las$NAME[la.neighbours[[which(las$NAME=='Leeds')]]]

#Another thing to optimise: keep the six with the largest borders.
#Though would be plenty without six neighbours. Err, like in this case!

#Need centroids
la.centroids <- st_centroid(las)
plot(st_geometry(la.centroids))#So many more in London!



#Oh wait...
#https://olihawkins.com/2018/02/1
#Slightly odd looking projection. Will see if that works.
hexmap <- st_read('data/hexmap-lad-ew.geojson')


#Is it the right number if we drop wales? Tick!
hexmap.eng <- hexmap %>% filter(g!='W')

tmap_mode("view")
qtm(hexmap.eng)
plot(st_geometry(hexmap.eng))
qtm(las)

#What's the projection, bounding box? That looks like standard latlon
st_bbox(hexmap.eng)

summary(hexmap.eng)

st_write(hexmap.eng,'data/hexmap-lad-england.geojson')

#Not working. Let's try exporting one of these zones, see what the feck
st_write(hexmap.eng %>% filter(grepl(pattern = 'Sheffield',x = .$n)),
         'data/hexmap-lad-sheffield.geojson')

#try casting to multipolygon (it's currently vanilla polygon)
#No reason to think this would work but...
hexmap.eng.multi <- st_cast(hexmap.eng, "MULTIPOLYGON")

class(hexmap.eng.multi$geometry)

st_write(hexmap.eng.multi,'data/hexmap-lad-england-multipolygon.geojson')

#Nope. What if I save as shapefile, reload, resave?
st_write(hexmap.eng,'data/hexmap-lad-england.shp')

hexmap2 <- st_read('data/hexmap-lad-england.shp')

#Add regional number so colour can work in D3
hexmap2$regionindex <- as.numeric(hexmap2$g)

tmap_mode("view")
qtm(hexmap2)

st_write(hexmap2,'data/hexmap-lad-england3.geojson')


#Saving version with clean names
hexmap.eng.cleannames <- hexmap2
hexmap.eng.cleannames$n <- stringr::str_replace_all(hexmap.eng.cleannames$n, "[[:punct:]]", " ")



#st_write(hexmap2,'data/hexmap-lad-england3.geojson')
st_write(hexmap.eng.cleannames,'data/hexmap-lad-england_cleannames.geojson')



#~~~~~~~~~~~~~~~~~~~
#GET GOR OVERLAY----
#~~~~~~~~~~~~~~~~~~~

#Reload hexmap from shapefile for this so we know it should actually render.
hexmap <- st_read('data/hexmap-lad-england.shp')

#In theory in sf I can just group_by and summarise, can I?
hexmap.regions <- hexmap %>% 
  group_by(g) %>% 
  summarise(count = n())

plot(hexmap.regions)

#Yup!
st_write(hexmap.regions,'data/hexmap_regions.geojson')



#~~~~~~~~~~~~~~~~~~~
#GET MEAN IMD VAL PER LA AND ADD TO HEXMAP----
#~~~~~~~~~~~~~~~~~~~

#Blimey, 1.39gb...
imd2019.geo <- readRDS('data/imd2019geo.rds')

#To get mean main IMD, we just need...
imd2019.geo <- imd2019.geo %>% 
  filter(Measurement=='Rank',`Indices of Deprivation` == 'a. Index of Multiple Deprivation (IMD)')  


imd2019.meanrankforLA <- imd2019.geo %>% 
  st_set_geometry(NULL) %>% 
  group_by(LAD17NM) %>% 
  summarise(mean = mean(Value), median = median(Value),
            lowest = min(Value), highest = max(Value))

#Clean so match works
imd2019.meanrankforLA$LAD17NM <- stringr::str_replace_all(imd2019.meanrankforLA$LAD17NM, "[[:punct:]]", " ")

#Load non-data-y hexmap and attach 2015 data and mean/median data and diff data
hex <- st_read('data/hexmap-lad-england_cleannames.geojson')

#Add 2015 data and 2015 - 2019 diffs (worked out in next section)
#Rerun the code as we want a slightly different structure
#Plan: append 2015 and 2019 to the summaryvars 
#As well as the actual rank values
#Diffs of course are both
imd2015 <- read_csv('data/File_7_ID_2015_All_ranks__deciles_and_scores_for_the_Indices_of_Deprivation__and_population_denominators.csv')


#2015 summaries
imd2015.meanrankforLA <- imd2015 %>% 
  rename(LAD17NM = `Local Authority District name (2013)`) %>% 
  group_by(LAD17NM) %>% 
  summarise(mean2015 = mean(`Index of Multiple Deprivation (IMD) Rank (where 1 is most deprived)`), 
            median2015 = median(`Index of Multiple Deprivation (IMD) Rank (where 1 is most deprived)`),
            lowest2015 = min(`Index of Multiple Deprivation (IMD) Rank (where 1 is most deprived)`), 
            highest2015 = max(`Index of Multiple Deprivation (IMD) Rank (where 1 is most deprived)`))

#let's see if names are rough match... ah, exact. Nice.
table(unique(imd2019.geo$LAD17NM) %in% unique(imd2015$`Local Authority District name (2013)`))


#Repeat summaries for 2019, change names so 2019 selectable
imd2019.meanrankforLA <- imd2019.geo %>% 
  st_set_geometry(NULL) %>% 
  group_by(LAD17NM) %>% 
  summarise(mean2019 = mean(Value), median2019 = median(Value),
            lowest2019 = min(Value), highest2019 = max(Value))



#Get 2015-19 diffs (worked out below)
bothdiff <- readRDS('data/diff15_19.rds')

#Check LA names have been cleaned in all
bothdiff$LAD17NM <- stringr::str_replace_all(bothdiff$LAD17NM, "[[:punct:]]", " ")
imd2019.meanrankforLA$LAD17NM <- stringr::str_replace_all(imd2019.meanrankforLA$LAD17NM, "[[:punct:]]", " ")
imd2015.meanrankforLA$LAD17NM <- stringr::str_replace_all(imd2015.meanrankforLA$LAD17NM, "[[:punct:]]", " ")

#Tick
table(hex$n %in% bothdiff$LAD17NM)
table(hex$n %in% imd2019.meanrankforLA$LAD17NM)
table(hex$n %in% imd2015.meanrankforLA$LAD17NM)



#Autobots, attach!
hex2 <- hex %>% 
  left_join(imd2015.meanrankforLA, by = c("n"="LAD17NM"))
hex2 <- hex2 %>% 
  left_join(imd2019.meanrankforLA, by = c("n"="LAD17NM"))
hex2 <- hex2 %>% 
  left_join(bothdiff, by = c("n"="LAD17NM"))


#Save!
st_write(hex2,'data/hexmap-lad-england_cleannames_w_meanmedian_n_diffs_2015_2019.geojson')


#need the ranges for the diffs...
apply(bothdiff,2,range)
#range(bothdiff$meandiff)

#Bet they use same scale
plot(hex %>% select(meandiff,mediandiff,lowestdiff,highestdiff))
plot(hex %>% select(meandiff))
plot(hex %>% select(mediandiff))
plot(hex %>% select(lowestdiff))
plot(hex %>% select(highestdiff))


#Reload, get ranges
hex <- st_read('data/hexmap-lad-england_cleannames_w_meanmedian_n_diffs_2015_2019.geojson')

apply(hex %>% select(meandiff:highestdiff),2,range)

#~~~~~~~~~~~
#IMD2015----
#~~~~~~~~~~~

#https://www.gov.uk/government/statistics/english-indices-of-deprivation-2015
imd2015 <- read_csv('data/File_7_ID_2015_All_ranks__deciles_and_scores_for_the_Indices_of_Deprivation__and_population_denominators.csv')


#Well that's good and easy.
#Let's start just by summarising per local authority and see if there were any major changes
#Still name number of LAs
imd2015.meanrankforLA <- imd2015 %>% 
  group_by(`Local Authority District name (2013)`) %>% 
  summarise(mean = mean(`Index of Multiple Deprivation (IMD) Rank (where 1 is most deprived)`), 
            median = median(`Index of Multiple Deprivation (IMD) Rank (where 1 is most deprived)`),
            lowest = min(`Index of Multiple Deprivation (IMD) Rank (where 1 is most deprived)`), 
            highest = max(`Index of Multiple Deprivation (IMD) Rank (where 1 is most deprived)`))

#let's see if names are rough match... ah, exact. Nice.
table(unique(imd2019.geo$LAD17NM) %in% unique(imd2015$`Local Authority District name (2013)`))


#Repeat summaries for 2019
imd2019.meanrankforLA <- imd2019.geo %>% 
  st_set_geometry(NULL) %>% 
  group_by(LAD17NM) %>% 
  summarise(mean = mean(Value), median = median(Value),
            lowest = min(Value), highest = max(Value))

# imd2015n2019.LAsummaryvars <- left_join(
#   imd2015.meanrankforLA,
#   imd2019.meanrankforLA,
#   by = c("Local Authority District name (2013)"="LAD17NM")
# )

#Actually, better to make long
imd2015.meanrankforLA$year = 2015
imd2019.meanrankforLA$year = 2019

imd2015n2019.LAsummaryvars <- rbind(imd2015.meanrankforLA %>% rename(LAD17NM=`Local Authority District name (2013)`),
                                    imd2019.meanrankforLA)


#To look for change between years...
#Well, could make all long and find grouped lags.
#Might also just be worth visualising?
#Nah, long, can then facet...
imd2015n2019.LAsummaryvars.long <- imd2015n2019.LAsummaryvars %>% 
  gather(key = summaryvar, value = value, mean:highest)


#Make a big plot! Except facet-wrapping - will only be able to order by one var
ggplot(imd2015n2019.LAsummaryvars.long, aes(x = fct_reorder(LAD17NM,value), y = value, colour = factor(year))) +
  geom_point(size = 2) +
  facet_wrap(~summaryvar,nrow=1) +
  coord_flip()

ggsave('misc/bigplot.png', width = 15,height= 15)



#Yep, let's break down, look separately
ggplot(imd2015n2019.LAsummaryvars.long %>% filter(summaryvar == 'lowest'), aes(x = fct_reorder(LAD17NM,value), y = value, colour = factor(year))) +
  geom_point(size = 2) +
  theme(axis.text.x = element_text(angle = 90, hjust = 1))


ggsave('misc/lowest.png', width = 20,height= 7)




#Would be good to order by change in magnitude
#For which we need... actually, we don't need lag. Backtrack, let's do this the easy way.
#Actually, I don't think spread lets you spread more than one var


#Well... we just want differences for 2019
#Order both of these by LA
imd2019.meanrankforLA <- imd2019.meanrankforLA %>%
  arrange(LAD17NM)

imd2015.meanrankforLA <- imd2015.meanrankforLA %>%
  # rename(LAD17NM=`Local Authority District name (2013)`) %>% 
  arrange(LAD17NM)

#OK, they're in the right order
bothdiff <- data.frame(
  LAD17NM = imd2019.meanrankforLA$LAD17NM,
  meandiff = imd2019.meanrankforLA$mean - imd2015.meanrankforLA$mean,
  mediandiff = imd2019.meanrankforLA$median - imd2015.meanrankforLA$median,
  lowestdiff = imd2019.meanrankforLA$lowest - imd2015.meanrankforLA$lowest,
  highestdiff = imd2019.meanrankforLA$highest - imd2015.meanrankforLA$highest
)

saveRDS(bothdiff,'data/diff15_19.rds')


apply(bothdiff %>% select(-LAD17NM),2,range)


#OK, now I can attach to the actual data and use the diffs to order by
ggplot(imd2015n2019.LAsummaryvars.long %>% filter(summaryvar == 'mean') %>% 
         left_join(bothdiff, by = "LAD17NM")
       , 
       aes(x = fct_reorder(LAD17NM,meandiff), y = value, group = LAD17NM, colour = factor(year))) +
  geom_line(alpha=0.5,colour='black') +
  geom_point(size = 2) +
  theme(axis.text.x = element_text(angle = 90, hjust = 1))


ggsave('misc/mean_meandiff.png', width = 20,height= 7)




#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#ADD TOP BOTTOM DECILE PROPS TO HEX DATA----
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

hex <- st_read('data/hexmap-lad-england_cleannames_w_meanmedian_n_diffs_2015_2019.geojson')

#Already did this code. ("HIGHEST LOWEST DECILE CHANGES BETWEEN YEARS")
#Check it, use it here.
imd <- readRDS('data/imd2015_2019_priorToSeparatingByLA.rds') %>% st_set_geometry(NULL)

#While we're here, get count of zones per LA
LAzonecount <- imd %>% 
  group_by(LAD17NM) %>% 
  summarise(LAcount = n())


#Drop rank, make decile long, group by that and LA, count
imd <- imd %>% 
  select(-code,-Rank2015,-Rank2019)

imd <- imd %>% 
  gather(key = decile, value = value, Decile2019:Decile2015)


#This will be missing zeroes in deciles with no count.
#Can't get fecking complete to work.
imd.countindeciles <- imd %>% 
  group_by(LAD17NM,decile,value) %>% 
  summarise(count = n()) 
#  complete(value, nesting(decile,value), fill = list(count = 0))


imd.countindeciles <- imd.countindeciles %>% 
left_join(LAzonecount, by = "LAD17NM")

imd.countindeciles <- imd.countindeciles %>% 
  mutate(decileprop = (count/LAcount)*100)




#Keep only 1st and 10th deciles
#Break into separate years also
first2015 <- imd.countindeciles %>% 
  ungroup() %>% 
  filter(value==1,decile=="Decile2015") %>% 
  select(LAD17NM,decile1prop2015 = decileprop)#most deprived

first2019 <- imd.countindeciles %>% 
  ungroup() %>% 
  filter(value==1,decile=="Decile2019") %>% 
  select(LAD17NM,decile1prop2019 = decileprop)#most deprived

tenth2015 <- imd.countindeciles %>% 
  ungroup() %>% 
  filter(value==10,decile=="Decile2015") %>% 
  select(LAD17NM,decile10prop2015 = decileprop)#least deprived

tenth2019 <- imd.countindeciles %>% 
  ungroup() %>% 
  filter(value==10,decile=="Decile2019") %>% 
  select(LAD17NM,decile10prop2019 = decileprop)#least deprived



#Now - when we merge those in to Hex, we'll get NAs.
#Those will be zeroes so need to replace.
#Can do diffs once they're in there. 
hex2 <- hex %>% 
  left_join(first2015, by = c("n"="LAD17NM"))
hex2 <- hex2 %>% 
  left_join(first2019, by = c("n"="LAD17NM"))
hex2 <- hex2 %>% 
  left_join(tenth2015, by = c("n"="LAD17NM"))
hex2 <- hex2 %>% 
  left_join(tenth2019, by = c("n"="LAD17NM"))

#If there are no NAs elsewhere, can just replace them all. Tick
table(is.na(hex2 %>% select(1:18)))

#Except I actually want those values marked as grey
#So need marker value for zero like -99999999

#But need zeroes to do diff calcs
#So copy!
hexdiffs <- hex2
hexdiffs[is.na(hexdiffs)] <- 0

hexdiffs$decile1propdiff <- hexdiffs$decile1prop2019-hexdiffs$decile1prop2015
hexdiffs$decile10propdiff <- hexdiffs$decile10prop2019-hexdiffs$decile10prop2015



#Mark main hex NAs as the marker "missing" value (i.e. no LSOAs in that decile)
hex2[is.na(hex2)] = -999999

#Add in diffs
# hex3 <- cbind(hex2,hexdiffs %>% st_set_geometry(NULL) %>% select(decile1propdiff,decile10propdiff))

#For some reason cbind won't work. How about...?
hex3 <- hex2 %>%
  left_join(
    hexdiffs %>% st_set_geometry(NULL) %>% select(n,decile1propdiff,decile10propdiff),
    by="n"
  )

#There are a bunch of columns there we don't need, in fact.
hex3 <- hex3 %>% 
  select(-c,-q,-r,-g,-regionindex)

#If I round some numbers, the file should get smaller, right?
#Some can be integers e.g. the mean and median IMD values
#Keep more for the proportions, small diffs will matter
hex4 <- hex3 %>% 
  mutate(
    mean2015 = round(mean2015,2),
    mean2019 = round(mean2019,2),
    meandiff = round(meandiff,2),
    decile1prop2015 = round(decile1prop2015,4),
    decile1prop2019 = round(decile1prop2019,4),
    decile10prop2015 = round(decile10prop2015,4),
    decile10prop2019 = round(decile10prop2019,4),
    decile10propdiff = round(decile10propdiff,4),
    decile10propdiff = round(decile10propdiff,4)
         )



#OK?
st_write(hex4,'data/hexmap-lad-england_cleannames_w_meanmedian_deciles_n_diffs_2015_2019.geojson')


#While we're here - also need ranges for those vars for the colour scales:
apply(hexdiffs %>% select(decile1prop2015:decile10propdiff),2,range)
apply(hexdiffs %>% select(lowest2015:decile10propdiff),2,range)

#Max decile10prop2019 is going to be from small number of zones? Nah, both have plenty.
hexdiffs[which(hexdiffs$decile10prop2019>66.6666),]


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#RELOAD HEX DATA TO PICK OUT STORIES----
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

hex <- st_read('data/hexmap-lad-england_cleannames_w_meanmedian_deciles_n_diffs_2015_2019.geojson')

#min and max for... everything?
minmaxes <- data.frame(apply(hex %>% select(mean2015:decile10propdiff),2,range))

mm <- data.frame(name = names(minmaxes), 
                 mins = as.numeric(minmaxes[1,]) , 
                 maxs = as.numeric(minmaxes[2,])) %>% 
  gather(key = thing, value = value, mins:maxs)

#For merging place names against
hexlong <- hex %>% 
  st_set_geometry(NULL) %>% 
  gather(key = name, value = value, mean2015:decile10propdiff)


mm.which <- mm %>% 
  left_join(hexlong, by = c('name','value'))

#remove -999999s
mm.which <- mm.which %>% 
  filter(value!=-999999)



#What's the one with none in the bottom decile but lowest median?
x <- hex %>% filter(decile1prop2019 == -999999)
#West somerset but that's v low zone count
#Lambeth, Torridge, Slough, Harlow



#Aaaand the biggest difference between mean and median?
#(To illustrate how they differ)
hex$mean_median_diff2019 <- hex$mean2019 - hex$median2019

#Middlesbrough: biggest pos diff: 5676. Mean: 9190. Median: 3513
#Three Rivers: biggest neg diff: -3504. Mean: 25162. Median: 28666

#And what's lowest diff for comparison?
#Apart from Isles of fecking scilly!
hex_noscilly <- hex %>% filter(n!="Isles of Scilly")

hex_noscilly$mean_median_diff2019[which(hex_noscilly$mean_median_diff2019 == min(abs(hex_noscilly$mean_median_diff2019)))]
hex_noscilly$n[which(hex_noscilly$mean_median_diff2019 == min(abs(hex_noscilly$mean_median_diff2019)))]


#Plotting that shizzle
imdsub <- imd %>% 
  filter(LAD17NM %in% c(
    'Middlesbrough',
    'Three Rivers',
    'Bassetlaw'
  )) %>% 
  select(LAD17NM,Rank2019)


ggplot(imdsub, aes(x=Rank2019)) +
  geom_histogram(bins = 10) +
  # geom_vline(xintercept = mean(Rank2019)) +
  facet_wrap(~LAD17NM)


#What's the mean median diff for Northumberland and Bury?
#(The two "most like England")
hex$mean_median_diff2019[
  which(hex$n %in% c('Northumberland','Bury'))
]


#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#Using standard deviation to look for "most typical LA"----
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

#Theory: SD on LA decile proportions- minimum SD should be "most typical"
imd <- readRDS('data/imd2015_2019_priorToSeparatingByLA.rds') %>% st_set_geometry(NULL)

#Getting decile proportions... is done in javascript! 
#Didn't I have that here somewhere too?
#Yes!

#While we're here, get count of zones per LA
LAzonecount <- imd %>% 
  group_by(LAD17NM) %>% 
  summarise(LAcount = n())


#Drop rank, make decile long, group by that and LA, count
imd <- imd %>% 
  select(-code,-Rank2015,-Rank2019)

imd <- imd %>% 
  gather(key = decile, value = value, Decile2019:Decile2015)


#This will be missing zeroes in deciles with no count.
#Can't get fecking complete to work.
imd.countindeciles <- imd %>% 
  group_by(LAD17NM,decile,value) %>% 
  summarise(count = n()) 
#  complete(value, nesting(decile,value), fill = list(count = 0))


imd.countindeciles <- imd.countindeciles %>% 
  left_join(LAzonecount, by = "LAD17NM")

imd.countindeciles <- imd.countindeciles %>% 
  mutate(decileprop = (count/LAcount)*100)



#That's good but doesn't have zeroes in, which we could do with really.
#Couldn't get complete to work
#Drop unnecessary cols, only need proportion now
#If we just stick to 2019 to make this easier to think about
imd.countindeciles <- imd.countindeciles %>% 
  ungroup() %>% 
  filter(decile == "Decile2019") %>% 
  select(-count,-LAcount,-decile) 
  

#SURELY got to be a better way! 
combo <- list()

for(i in unique(imd.countindeciles$LAD17NM)){
  
  x <- imd.countindeciles %>% filter(LAD17NM == i)
  
  for(j in 1:10){
    #sum(x$value==1)#will be zero if doesn't contain the number, one otherwise
    if(sum(x$value==j)==0){
      
      x <- rbind(
        x,
        data.frame(LAD17NM = unique(x$LAD17NM), value = j, decileprop = 0)
        )
      
    }
  }
  
  combo[[length(combo)+1]] <- x
  
}

y <- bind_rows(combo)


#Well it's now ten times the number of LAs so that's promising!
#We know manchester has none in top two:
View(y %>% filter(LAD17NM=="Manchester"))
View(y %>% filter(LAD17NM=="Hart"))#None in the lowest five!



#OK! NOW FOR SD
sds2019 <- y %>% 
  group_by(LAD17NM) %>% 
  summarise(sd = sd(decileprop))




#~~~~~~~~~~~~~~~
#REPEAT FOR 2015
imd.countindeciles <- imd %>% 
  group_by(LAD17NM,decile,value) %>% 
  summarise(count = n()) 


imd.countindeciles <- imd.countindeciles %>% 
  left_join(LAzonecount, by = "LAD17NM")

imd.countindeciles <- imd.countindeciles %>% 
  mutate(decileprop = (count/LAcount)*100)


imd.countindeciles <- imd.countindeciles %>% 
  ungroup() %>% 
  filter(decile == "Decile2015") %>% 
  select(-count,-LAcount,-decile) 


combo <- list()

for(i in unique(imd.countindeciles$LAD17NM)){
  
  x <- imd.countindeciles %>% filter(LAD17NM == i)
  
  for(j in 1:10){
    #sum(x$value==1)#will be zero if doesn't contain the number, one otherwise
    if(sum(x$value==j)==0){
      
      x <- rbind(
        x,
        data.frame(LAD17NM = unique(x$LAD17NM), value = j, decileprop = 0)
      )
      
    }
  }
  
  combo[[length(combo)+1]] <- x
  
}

y <- bind_rows(combo)

sds2015 <- y %>% 
  group_by(LAD17NM) %>% 
  summarise(sd = sd(decileprop))




#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#TESTING LAND COVER CLIP FOR lAs----
#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

shef <- st_read('C:/Users/admin/Dropbox/SheffieldMethodsInstitute/GreenSpace/Sheffield/shef_landcover.shp') %>% 
  st_transform(4326)

shef.urb.suburb <- shef %>% 
  filter(bhab %in% c('Urban','Suburban'))

plot(st_geometry(shef.urb.suburb))

#Suspect that's missing a lot of the LA?
shef.la <- st_read("C:/Users/admin/Dropbox/WWWdev/D3_imd2019/imd2019compare/public_html/data/localauthorities/Sheffield.geojson")

plot(st_geometry(shef.la))
plot(st_geometry(shef.urb.suburb),add=T, col="RED")

allurbsuburb <- st_union(shef.urb.suburb)
plot(st_geometry(allurbsuburb),col="RED")

#just to see
x <- st_intersection(shef.la,allurbsuburb)


plot(x[,'Value2019'])





