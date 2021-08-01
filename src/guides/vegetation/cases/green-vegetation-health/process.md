---
case: 'green-vegetation-health'
content: 'process'
---
## Step 1: Download and install QGis
QGis is a free geographic information system application that supports viewing, editing, and analysis of geospatial data. Although it is free, it is a very professional software that is also used by satellite imagary professionals.

QGis can be installed on all major operating systems. These include Mac OS, Microsoft Windows and also Linux.

Installation instructions and the download for the software itself can be found here: [https://www.qgis.org/en/site/forusers/download.html](https://www.qgis.org/en/site/forusers/download.html)

The installation requires 15-25 minutes. After completion, you can skip to step two.

## Step 2: Open QGis and start a new project
Great, you've cleared the first hurdle. Now the fun begins, because we are going to edit the satellite data!

The first thing to do is to start the QGis software you just installed. Now go to Project in the menu and then select `New`.

![](/img/2-start-project.png)

For the next steps: Depending on which operating system you are using, the display of QGis may be slightly different. However, the corresponding options and fields should still be available.

And one more thing: Of course, I don't use the same data on the screenshots that you do. In other words, my data may look different. Don't let this confuse you.

## Step 3: Open the data
It sounds complicated to open satellite data, doesn't it? But it's not so bad, QGis does most of the work for us.

It’s pretty easy to open the files: Just go to the directory where your satellite data is saved, probably in the downloads directory, select the files and drag them into the layers panel in QGis. Just take a look on my screen to know exactly where to drag them:

<video width="100%" height="auto" controls>
  <source src="/img/3-open-data.mp4" type="video/mp4">
</video>

Note: If you have downloaded the files as a ZIP file, unpack them first.

No you can see your data in the layers panel and on the right, big panel you can see your data visualized. A bit too grey, isn't it? We'll take care of that in a moment...

Make sure that you save your project. Do this by clicking on `Project` and then on `Save as`. A new window opens and you can choose the right directory on your PC and give your project a suitable name. Then just click on `Save`.

## Step 4: Add a map for better orientation
So that we can orient ourselves better on the data, we put a map on top of the data. You can imagine it like Google Maps. So we can see better where we are. In technical language, such maps are called basemaps. That’s, too, super simple. So, let's add a basemap.

Go to the `browser panel` (on top of the layers panel) and look for the entry `XYZ Tiles`. Click on the small arrow on the left. Now just double click on `OpenStreetMap`. 

<video width="100%" height="auto" controls>
  <source src="/img/4-add-basemap.mp4" type="video/mp4">
</video>

<details>
  <summary>💡 What is OpenStreetMap?</summary>
    OpenStreetMap, or OSM in short, is an <a href="https://www.openstreetmap.org">alternative to Google Maps</a>. The cool thing is it is completely free to use and open source. That means everybody can contribute to the maps and you can do whatever you want with the data. But that's not important for us now. If you are interested in OSM, take a look at <a href="https://www.openstreetmap.org/about">their website</a>.
</details>

Congratulations, you’ve added a basemap to your project. 

But, what happened there! Sometimes the basemap lays on top of your satellite data and you can't see it anymore, other times the basemap lays between or under the data and you cant see the basemap anymore. No problem, we will fix this.

Depending on what you want to do, you can change the opacity of the layers, the order or hide specific layers. For now, we will just put the basemap behind our data. To do that, we just can rearrange the order of the layers with simple drag and drop. Select the OpenStreetMap layer and drag it to the bottom of the list.

<video width="100%" height="auto" controls>
  <source src="/img/4-order-layers.mp4" type="video/mp4">
</video>