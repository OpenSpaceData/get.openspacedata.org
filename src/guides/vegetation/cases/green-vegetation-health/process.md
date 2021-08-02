---
case: 'green-vegetation-health'
content: 'process'
---
### Step 1: Download and install QGis
QGis is a free geographic information system application that supports viewing, editing, and analysis of geospatial data. Although it is free, it is a very professional software that is also used by satellite imagary professionals.

QGis can be installed on all major operating systems. These include Mac OS, Microsoft Windows and also Linux.

Installation instructions and the download for the software itself can be found here: [https://www.qgis.org/en/site/forusers/download.html](https://www.qgis.org/en/site/forusers/download.html)

The installation requires 15-25 minutes. After completion, you can skip to step two.

### Step 2: Open QGis and start a new project
Great, you've cleared the first hurdle. Now the fun begins, because we are going to edit the satellite data!

The first thing to do is to start the QGis software you just installed. Now go to Project in the menu and then select `New`.

![](/img/ndvi-2-start-project.png)

For the next steps: Depending on which operating system you are using, the display of QGis may be slightly different. However, the corresponding options and fields should still be available.

And one more thing: Of course, I don't use the same data on the screenshots that you do. In other words, my data may look different. Don't let this confuse you.

### Step 3: Open the data
It sounds complicated to open satellite data, doesn't it? But it's not so bad, QGis does most of the work for us.

It’s pretty easy to open the files: Just go to the directory where your satellite data is saved, probably in the downloads directory, select the files and drag them into the layers panel in QGis. Just take a look on my screen to know exactly where to drag them:

<video width="100%" height="auto" controls>
  <source src="/img/ndvi-3-open-data.mp4" type="video/mp4">
</video>

*Note: If you have downloaded the files as a ZIP file, unpack them first.*

No you can see your data in the layers panel and on the right, big panel you can see your data visualized. A bit too grey, isn't it? We'll take care of that in a moment...

Make sure that you save your project. Do this by clicking on `Project` and then on `Save as`. A new window opens and you can choose the right directory on your PC and give your project a suitable name. Then just click on `Save`.

### Step 4: Add a map for better orientation
So that we can orient ourselves better on the data, we put a map on top of the data. You can imagine it like Google Maps. So we can see better where we are. In technical language, such maps are called basemaps. That’s, too, super simple. So, let's add a basemap.

Go to the `browser panel` (on top of the layers panel) and look for the entry `XYZ Tiles`. Click on the small arrow on the left. Now just double click on `OpenStreetMap`. 

<video width="100%" height="auto" controls>
  <source src="/img/ndvi-4-add-basemap.mp4" type="video/mp4">
</video>

<details>
  <summary>💡 What is OpenStreetMap?</summary>
    OpenStreetMap, or OSM in short, is an <a href="https://www.openstreetmap.org">alternative to Google Maps</a>. The cool thing is it is completely free to use and open source. That means everybody can contribute to the maps and you can do whatever you want with the data. But that's not important for us now. If you are interested in OSM, take a look at <a href="https://www.openstreetmap.org/about">their website</a>.
</details>

**Congratulations**, you’ve added a basemap to your project. 

But, what happened there! Sometimes the basemap lays on top of your satellite data and you can't see it anymore, other times the basemap lays between or under the data and you cant see the basemap anymore. No problem, we will fix this.

Depending on what you want to do, you can change the opacity of the layers, the order or hide specific layers. For now, we will just put the basemap behind our data. To do that, we just can rearrange the order of the layers with simple drag and drop. Select the OpenStreetMap layer and drag it to the bottom of the list.

<video width="100%" height="auto" controls>
  <source src="/img/ndvi-4-order-layers.mp4" type="video/mp4">
</video>

### Step 5: Learn about your data and how to get the vegetation health information from it
Well, brace yourself: now comes the magic. What happens now? We will process the data so that we can see from the image where healthy green plants are, where plants are not healthy and where there are no plants.

**How do we do that?** \
We use a method that calculates the different data with a certain formula so that the result is a value between -1 and +1 for each point on the image. -1 stands for "no vegetation" and +1 for "healthy vegetation". For the sake of simplicity, we can also refer to vegetation as plants.

This method is called calculating an index. The index is the result of the formula and the formula we use is called NDVI, the Normalized Difference Vegetation Index.

This all sounds very complicated, doesn't it? Let's start from the beginning. What exactly is our satellite data?

*Note: This content is optional. If you are not interested in the theoretical background, just jump to Step 6.*

<details>
  <summary>💡 Our data from the satellite are called raster data. So, what does this mean?</summary>
    <img src="/img/ndvi-ndvi-5-raster-data.png" alt="">
    <p>Raster data is like a picture that you would take with a digital camera: at the lowest level of abstraction, it is a list of pixels with values. When you ‘zoom in’ and look closer at raster data, at some point you’ll see these discrete pixels, and it will look pixelated.</p>
    <p>Raster data is used in pictures of the Earth, like those taken by satellites - but that is just the beginning. Pixels don’t need to have colors - instead, each pixel can have a number that represents height and the raster data as a whole stores elevation data. Or pixels can store temperature or reflection data and be useful for environmental work.</p>
</details>

Cool, we have raster data. But why do you have multiple files of the same location and why do they look different? That’s are different bands. On this project we use Band 4 and Band 8 of the satellite.

<details>
  <summary>💡 What are satellite bands?</summary>
    The pixels in raster data are not necessarily just filled color: we call its contents ‘bands’. A normal image has three familiar bands: Red, Green, and Blue. Combined, they make a picture we’re familiar with. Some raster data can have fewer bands, like just one for elevation, or some can have a lot more - not just visible colors, but wavelengths we can’t see, like infrared and ultraviolet. When raster data is analyzed and displayed, you can combine and pick different bands to use to suit what you’re looking for.
</details>

*Sure, raster data, bands, but what the heck is the NDVI?* Great question, my friend. With the specific formula of the NDVI we will combine the Bands 4 and 8. Why? Read on:

<details>
  <summary>💡 How does the NDVI indicator work?</summary>
    <p>Wikipedia says something like, “The normalized difference vegetation index (NDVI) is a simple graphical indicator that can be used to analyze satellite data, assessing whether or not the target being observed contains live green vegetation.”.</p>
    <p>The NDVI thus takes advantage of the property that healthy vegetation reflects visible red light only weakly but infrared radiation strongly, which is more or less not the case for other surface coverings such as buildings, soil or water, which is why the latter tend to receive a negative vegetation index when calculating the NDVI.</p>
    <p>The values of the NDVI can lie between -1 and +1. Positive values indicate green vegetation. The higher the positive NDVI value, the healthier the vegetation.</p>
</details>

Enough dry theory. Now it's down to the nitty-gritty.

### Step 6: Calculating the NDVI
Let’s get ready to rumble. What we will do now, is calculate the NDVI from the data you’ve downloaded.

The formula for the NDVI is the following: (B08 - B04) / (B08 + B04)

Band 8, or shorter B08, represents the near infrared radiation and Band 4, or B04, the visible red.

To use this formula in QGis and with your data, you have to go the following steps:

1. Click on `Raster` in the top menu.
2. Choose the `raster calculator`. A new window should open now.
3. Below the field `Output layer` is a button with 3 points. Click on it and write “NDVI” in the file name input field. Click `Save`.
4. Copy the following formular and paste it into the field named `Raster Calculator Expression`: ( "B08@1" - "B04@1" ) / ( "B08@1" + + "B04@1" )
5. Click `Ok`.
6. Wait for it… Voila.

<video width="100%" height="auto" controls>
  <source src="/img/ndvi-6-calculate-ndvi.mp4" type="video/mp4">
</video>

That’s all. Almost.

### Step 7: Bring colour into the game
To make the data easier to understand, we want that no vegetation is brown and healthy vegetation green. For that we will colorize the grey image.

1. Double-click the NDVI layer in the layers panel. A new window will appear.
2. Choose `Symbology` on the left.
3. Change the `Render type` from Singleband gray to Singleband pseudocolor.
4. In the `Min` input write -1 and in the `Max` input 1.
5. On the right side of the color ramp dropdown is an arrow downwards. Click on it.
6. Then choose `All color ramps` and select `BrBG` (the second option from top).
7. Below the table with the colored squares, click on `classify`.
8. Click `Apply` _and_ `Ok`.

<video width="100%" height="auto" controls>
  <source src="/img/ndvi-7-colorize-data.mp4" type="video/mp4">
</video>

Well done, now it's looking much nicer, right?

### Step 8: Analyze your data
There are now two ways to take a closer look at the data. Either via QGis itself or you export. Both have their advantages and disadvantages. I will explain them to you in the following:

**Use QGis to move around the data**\
QGis offers a variety of ways to dive deep into your data. You can zoom in and out of the layers, move freely on the map and make individual layers more transparent to get an even better overview.

To make your NDVI layer more transparent so that you can see the basemap better, you first have to hide the two bands. We don't need them any more. Just click on the tick in front of the layer. My recommendation: Only tick the layers you really need. That way you keep the overview. In our case it is the NDVI layer and the basemap:

<video width="100%" height="auto" controls>
  <source src="/img/ndvi-8-layer-display.mp4" type="video/mp4">
</video>

Then click on the small brush in the layers panel. A new area has opened on the right side. Click on `Transparency` to set the transparency for each layer under `Global Transparency`. Make sure that you have selected the right layer. I set the transparency a little lower so that I can see the basemap underneath better. This makes it easier for me to orientate myself.

<video width="100%" height="auto" controls>
  <source src="/img/ndvi-8-layer-opacity.mp4" type="video/mp4">
</video>

Now you can explore the map and look at the different NDVI values, which lie between -1 and 1, for each pixel on your map. To do this, click on the symbol with the i and the mouse pointer in the toolbar. Select the function `Identify Features`. Now you can click on a point on the map that you are interested in. As soon as you have done this, a new area will open on the right side and you can read the value. You can read more about the meaning of the values in the Interpret step below.

<video width="100%" height="auto" controls>
  <source src="/img/ndvi-8-identify-features.mp4" type="video/mp4">
</video>

**Export the image**\
To be able to share your data with others or to print them, it is useful to export the data - for example as PDF or JPG. You can then share the files with other people without them having to have QGis installed. Practical, isn't it?

To do this, simply take the following steps:

1. Go to `Project` in the menu.
2. Select `Import/Export` and choose `Export Map to Image` or `Export Map to PDF`.
3. If you have selected PDF: Check the box `Create Geospatial PDF (GeoPDF)`.
4. Now click `Save`.
5. Select the location where you want to save the file, enter a file name and click `Save`.

<video width="100%" height="auto" controls>
  <source src="/img/ndvi-8-export-map.mp4" type="video/mp4">
</video>