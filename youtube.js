const puppeteer = require("puppeteer");
const pdfkit = require("pdfkit");
const fs = require("fs");
 
let link = "https://www.youtube.com/playlist?list=PLzkuLC6Yvumv_Rd5apfPRWEcjf9b1JRnq"
let cTab;
(async function(){
    try {
        const browserOpen = await puppeteer.launch({
            headless:false,
            slowMo:true,
            defaultViewport:null,
            args:["--start-maximized"]
        });

        let allTabsArr = await browserOpen.pages();
        cTab = allTabsArr[0];
        await cTab.goto(link);
        await cTab.waitForSelector('h1#title')
        let name = await cTab.evaluate(function(select){return document.querySelector(select).innerText}, 'h1#title');
        let allData = await cTab.evaluate(getData, '#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer');
        
        console.log(name, allData.noOfVideos, allData.noOfViews, allData.updatedDate);

        let totalVideos = allData.noOfVideos.split(" ")[0];
        console.log(totalVideos);

        let currentVideos = await getCVideosLength();
        console.log(currentVideos);

        while(totalVideos-currentVideos >= 20){
            await scrollToBottom();
            currentVideos = await getCVideosLength();
        }

        let finalList = await getStats();
        // console.log(finalList);

        let pdfDoc = new pdfkit();
        pdfDoc.pipe(fs.createWriteStream('playlist1.pdf'));
        pdfDoc.text(JSON.stringify(finalList));
        pdfDoc.end();

    } catch (error) {
        console.log(error);
    }
})()

function getData(selector){
    let allElems = document.querySelectorAll(selector);
    let noOfVideos = allElems[0].innerText;
    let noOfViews = allElems[1].innerText;
    let updatedDate = allElems[2].innerText;

    return{
        noOfVideos,
        noOfViews,
        updatedDate
    }

}

async function getCVideosLength(){
    let length = await cTab.evaluate(getLength, '#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer')
    return length;
}

function getLength(durationSelect){
    let durationelem = document.querySelectorAll(durationSelect);
    return durationelem.length;
}

async function scrollToBottom(){
    await cTab.evaluate(goToBottom)
    function goToBottom(){
        window.scrollBy(0, window.innerHeight)
    }
}

async function getStats(){
    let list = await cTab.evaluate(getNameAndDuration, '#video-title', '#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
    return list;
}

function getNameAndDuration(videoSelector, durationSelector){
    let videoElem = document.querySelectorAll(videoSelector);
    let durationElem = document.querySelectorAll(durationSelector);

    let currentList = [];
    for(let i=0; i<durationElem.length; i++){
        let videoTitle = videoElem[i].innerText;
        let duration = durationElem[i].innerText;
        currentList.push({
            videoTitle,
            duration
        });
        
    }
    return currentList;
}