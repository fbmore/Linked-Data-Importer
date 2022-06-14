var sketch = require("sketch");

var ui = require('sketch/ui');

var DataSupplier = require("sketch/data-supplier");
var document = sketch.getSelectedDocument();
// var selectedItem = document.selectedLayers.layers[0];
var selectedItemName = "Data-temp";

var documentName = "data";
if (document.path) {
    documentName = normalizePaths(document.path.split("/").reverse()[0]);
    documentName = documentName.replace(".sketchcloud", "");
    documentName = documentName.replace(".sketch", "");
}

var { isNativeObject } = require("util");
const fs = require("@skpm/fs");
const os = require("os");
const path = require("path");
const desktopDir = path.join(os.homedir(), "Desktop");
const sketchDir = path.join(
    os.homedir(),
    "Library/Application Support/com.bohemiancoding.sketch3"
);

var dataName = normalizePaths(selectedItemName) + ".json";

const sketchDataFolder = sketchDir + "/Linked-Data";
createFolder(sketchDataFolder);

// Setup the folder structure to export our data

const dataFolder = sketchDataFolder + "/Data-" + documentName;
const imagesFolder =
    dataFolder + "/Images-" + normalizePaths(selectedItemName);
const imagesFolderForJSON = "/Images-" + normalizePaths(selectedItemName);

createFolder(dataFolder);
createFolder(imagesFolder);

const exportOptions = {
    formats: "png",
    overwriting: true,
    output: imagesFolder,
};

export default function () {
    let images = {};

    
    // if (document.selectedLayers.isEmpty) {
    //     sketch.UI.message("Please select at least 1 layer.");
    //     return;
    // } else if (document.selectedLayers > 1) {
    //     sketch.UI.message("Please select maximum 1 layer.");
    //     return;
    // } else if (
    //     selectedItem.type !== "Group" &&
    //     selectedItem.type !== "SymbolInstance" &&
    //     selectedItem.type !== "SymbolMaster"
    // ) {
    //     sketch.UI.message(
    //         "Please select a Group, a Symbol Instance or a Symbol Source."
    //     );
    //     return;
    // }

    var json = [];
    for (var i = 0; i < document.selectedLayers.length; i++) {
        var layer = document.selectedLayers.layers[i];
        var data = getData(layer);
        if (data && Object.keys(data).length > 0) {
            json.push(data);
        }
    }

    if (dataFolder) {
        var imagesData = Object.values(images);
        if (imagesData.length > 0) {
            imagesData.forEach(function (image) {
                exportImageDataAsPng(
                    image.layer,
                    imagesFolder + "/" + String(image.name) + ".png"
                );
            });
        }
    }

    function getData(layer) {
        let data = {};
        let parent = layer.getParentPage();
        if (layer.type == "SymbolInstance" || layer.type == "SymbolMaster") {
            var overrides = layer.overrides.filter(function (o) {
                return (
                    // o.editable &&
                    ["symbolID", "stringValue", "image"].includes(o.property)
                );
            });
            var dataGroupByPath = { "": data };
            for (const o of overrides) {
                var pathComponents = o.path.split("/");
                pathComponents.pop();
                var parentPath = pathComponents.join("/");
                if (o.property == "symbolID") {
                    dataGroupByPath[o.path] = {};
                    if (dataGroupByPath[parentPath]) {
                        dataGroupByPath[parentPath][o.affectedLayer.name] =
                            dataGroupByPath[o.path];
                    }
                    continue;
                }
                if (o.property == "image") {
                    var key = String(o.value.id);
                    let imageObj = {};
                    imageObj["name"] =
                        normalizePaths(o.affectedLayer.name) + "-" + key;
                    imageObj["layer"] = o.value;
                    imageObj["parent"] = parent;
                    if (!images[key]) {
                        images[key] = imageObj;
                    }
                    dataGroupByPath[parentPath][o.affectedLayer.name] =
                        imagesFolderForJSON +
                        "/" +
                        normalizePaths(o.affectedLayer.name) +
                        "-" +
                        key +
                        ".png";
                } else {
                    dataGroupByPath[parentPath][o.affectedLayer.name] = o.value;
                }
            }
        } else if (layer.type == "Group") {
            for (const l of Array.from(layer.layers).reverse()) {
                if (l.type == "Group" || l.type == "SymbolInstance") {
                    data[l.name] = getData(l);
                } else if (l.type == "Text") {
                    data[l.name] = l.text;
                } else if (l.type == "Image") {
                    var key = String(l.image.id);
                    let imageObj = {};
                    imageObj["name"] = normalizePaths(l.name) + "-" + key;
                    imageObj["layer"] = l.image;
                    imageObj["parent"] = parent;
                    if (!images[key]) {
                        images[key] = imageObj;
                    }
                    data[l.name] =
                        imagesFolderForJSON +
                        "/" +
                        normalizePaths(l.name) +
                        "-" +
                        key +
                        ".png";
                } else {
                    var imageFill = l.style?.fills.reduce((prev, curr) => {
                        if (curr.fillType !== "Pattern") return prev;
                        return curr.pattern.image;
                    }, null);
                    if (!imageFill) break;
                    var key = String(imageFill);
                    let imageObj = {};
                    imageObj["name"] = l.name + "-" + key;
                    imageObj["layer"] = imageFill;
                    imageObj["parent"] = parent;
                    if (!images[key]) {
                        images[key] = imageObj;
                    }
                    data[l.name] =
                        imagesFolderForJSON + "/" + l.name + "-" + key + ".png";
                }
            }
        } else {
            return null;
        }
        data = removeEmptyNodes(data);
        return data;
    }

    // `data` can be `undefined` if the symbol overrides
    // in the selected layer are disabled
    if (data === undefined) {
        message("☝️ No symbol overrides found.");
    } else {

        /// hacking the JSON to test if the flow makes sense

        var staticData = {"label": "Hello Francesco! 😀"}

          
//////// from REMOTE CSV TO JSON  

// Fetch the values for a given page within a Google Sheet
// Return the parse data

    var queryURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcW7My8xoKPoHtFu8acMRNpreo7DLQPtvpSNit5g41ZorT2RTtHIg8-_7TqY10G04dXl0sjI-AwTbk/pub?output=tsv' 

    // staticData = fetchValuesFromRemoteFile(queryURL);

    // console.log("fetchValuesFromRemoteFile")
    // console.log(staticData)
    // console.log("fetchValuesFromRemoteFile END")

        /// Ask for Linked Data name


                var linkedDataName = "Data"

                var alertTitle = "Define a name for your Linked Data set";
                var instructionalTextForInput = "Enter name like 'Cities-Data'";
                var initialValue = "Cities-Data"
              
                //// Get user input
                ui.getInputFromUser(
                  alertTitle,
                  {
                    initialValue: initialValue,
                    description: instructionalTextForInput,
                    numberOfLines: 1
                  },
                  (err, value) => {
                    if (err) {
                      // most likely the user canceled the input
                      return;
                    } else {
                      console.log(value);
                      linkedDataName = value;
                    }
                  }
                );

                dataName = linkedDataName + ".json"


        /// add input to paste the CSV

        var result = ""

        var alertTitle = "Import Linked Data";
        var instructionalTextForInput = "👉 Paste URL to CSV or CSV below:";
        var initialValue = queryURL;
        //JSON.stringify(staticData, null, 2);;
        //"name,email\nFrancesco,fbmore@gmail.com"
      
        if (1){
        //// Get user input
        ui.getInputFromUser(
          alertTitle,
          {
            initialValue: initialValue,
            description: instructionalTextForInput,
            numberOfLines: 10
          },
          (err, value) => {
            if (err) {
              // most likely the user canceled the input
              return;
            } else {
              console.log(value);
              result = value;
            }
          }
        );

        }
      

        if (result.slice(0,4) == "http"){
            staticData = fetchValuesFromRemoteFile(result);

            console.log("fetchValuesFromRemoteFile")
            console.log(staticData)
            console.log("fetchValuesFromRemoteFile END")
    
        } else {
            var goodQuotes = result.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
      
            result = goodQuotes;
            //var array = result.split("\n")

            staticData = csvToJson(goodQuotes)
        }
    
      


        ///

        let json = JSON.stringify(staticData, null, 2);
        /// 
        // let json = JSON.stringify([data], null, 2);

        if (json.length === 0) {
            sketch.UI.message("No data found.");
            return;
        }

        // Finally, store the information in a `dat.json` file:
        try {
            let filePath = dataFolder + "/" + dataName;
            fs.writeFileSync(filePath, json);

            let message =
                "The " +
                dataName +
                " dataset is now available in your Sketch data sources";
            message += "\n";
            message +=
                "Go to 'Preferences panel -> Data' to access the folder with the imported data.";

            sketch.UI.alert("Linked Data import complete!", message);

            const url = NSURL.fileURLWithPath(filePath);

            const dataManager =
                AppController.sharedInstance().dataSupplierManager();

            if (dataManager.canAddLocalDataGroupWithURL(url)) {
                const dataSupplierGroup =
                    MSLocalDataSupplierGroup.localDataSupplierGroupFromFileSystemURL_dataSupplierDelegate_error_(
                        url,
                        dataManager,
                        nil
                    );
                if (dataSupplierGroup) {
                    dataManager.addLocalDataSupplierGroup(dataSupplierGroup);
                }
            }
        } catch (error) {
            sketch.UI.message(
                "⛔️ There was an error saving your file"
            );
        }
    }
}

// **************************************
// Script functions
// **************************************
function createFolder(folder) {
    try {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
    } catch (err) {
        console.error(err);
    }
}

function exportImageDataAsPng(imageData, path) {
    var rep = NSBitmapImageRep.imageRepWithData(imageData.nsdata);
    var png = rep.representationUsingType_properties(
        NSBitmapImageFileTypePNG,
        {}
    );
    png.writeToFile_atomically(path, "YES");
}

function exportImageDataAsJpg(imageData, path, quality) {
    var rep = NSBitmapImageRep.imageRepWithData(imageData.nsdata);
    var jpg = rep.representationUsingType_properties(
        NSBitmapImageFileTypeJPEG,
        { NSImageCompressionFactor: quality || 0.75 }
    );
    jpg.writeToFile_atomically(path, "YES");
}

function normalizePaths(path) {
    path = path.replace(/\s/g, "-");
    path = path.replace(/\_+/g, "-");
    path = path.replace(/\/+/g, "-");
    path = path.replace(/%20+/g, "-");
    path = path.replace(/\-+/g, "-").toLowerCase();

    return path;
}

/**
 * Takes a raw CSV string and converts it to a JavaScript object.
 * @param {string} text The raw CSV string.
 * @param {string[]} headers An optional array of headers to use. If none are
 * given, they are pulled from the first line of `text`.
 * @param {string} quoteChar A character to use as the encapsulating character.
 * @param {string} delimiter A character to use between columns.
 * @returns {object[]} An array of JavaScript objects containing headers as keys
 * and row entries as values.
 */


//  function csvToJson(text, headers, quoteChar = '"', delimiter = ',') {

 function csvToJson(text, headers, quoteChar = '"', delimiter = '	') {
    const regex = new RegExp(`\\s*(${quoteChar})?(.*?)\\1\\s*(?:${delimiter}|$)`, 'gs');
  
    const match = line => {
      const matches = [...line.matchAll(regex)].map(m => m[2]);
      matches.pop(); // cut off blank match at the end
      return matches;
    }
  
    const lines = text.split('\n');
    const heads = headers ?? match(lines.shift());
  
    return lines.map(line => {
      return match(line).reduce((acc, cur, i) => {
        // Attempt to parse as a number; replace blank matches with `null`
        const val = cur.length <= 0 ? null : Number(cur) || cur;
        const key = heads[i] ?? `extra_${i}`;
        return { ...acc, [key]: val };
      }, {});
    });
  }








//////// from REMOTE CSV TO JSON  

function fetchValuesFromRemoteFile(queryURL,staticData) {

  // TSB is available and better for parsing - This URL is from Francesco's fbmore@gmail.com GDrive   

  var request = NSMutableURLRequest.new()
  request.setHTTPMethod('GET')
  request.setURL(NSURL.URLWithString(queryURL))


  var error = NSError.new()
  var responseCode = null
  var response = NSURLConnection.sendSynchronousRequest_returningResponse_error(request, responseCode, error)

  console.log(response)


  var dataString = NSString.alloc().initWithData_encoding(response, NSUTF8StringEncoding).toString()
console.log("dataString")
  console.log(dataString)
console.log("dataString END")
  
    //// convert CSV to JSON
    var goodQuotes = dataString.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
    //var goodQuotes = dataString

      
    staticData = csvToJson(goodQuotes)

    console.log("static JSON Data")
console.log(staticData)
//console.log(staticData.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"'))
    console.log("static JSON Data END REPLACE")
    ///

let json = JSON.stringify(staticData, null, 2);

console.log("json")
console.log(json)

// var json = staticData

const obj = JSON.parse(json);

console.log("obj")
console.log(JSON.stringify(obj))

    /// 
    // let json = JSON.stringify([data], null, 2);

    if (json.length === 0) {
        sketch.UI.message("No data found.");
        return;
    }    

/////  


  try {
    //var data = JSON.parse(dataString)
    // var data = JSON.parse(staticData)

    var data = JSON.parse(JSON.stringify(obj))
    console.log("data")
    console.log(data)
    
    // return parseData(data)
    return data

  } catch(e) {
    sketch.UI.message("Failed to import file")
    return null
  }
}





////////

// Parse the data to how we want it
// function parseData(data) {
//     var values = {}
  
//     // data.feed.entry.forEach(function(entry) {
//     //   Object.keys(entry).filter(function(key) {
//     //     return key.indexOf('gsx$') == 0
//     //   }).forEach(function(key) {
//     //     var newKey = key.substring(4)
//     //     if (!(values.hasOwnProperty(newKey))) {
//     //       values[newKey] = []
//     //     }
  
//     //     var newValue = entry[key]['$t']
//     //     if (newValue) {
//     //       var currentArray = values[newKey]
//     //       currentArray.push(newValue)
//     //       values[newKey] = currentArray
//     //     }
//     //   })
//     // })
//     data.feed.entry.forEach(function(entry) {
//       Object.keys(entry).forEach(function(key) {
//         var newKey = key
//         if (!(values.hasOwnProperty(newKey))) {
//           values[newKey] = []
//         }
  
//         var newValue = entry[key]
//         if (newValue) {
//           var currentArray = values[newKey]
//           currentArray.push(newValue)
//           values[newKey] = currentArray
//         }
//       })
//     })
//     return {
//       title: data.feed.title,
//       values: values
//     }
//   }
  


///////


// **************************************
// Object functions
// **************************************

function removeEmptyNodes(obj) {
    let hasEmptyNodes = false;
    Object.entries(obj).forEach(([key, value]) => {
        if (Object.keys(value).length === 0) {
            delete obj[key];
            hasEmptyNodes = true;
        } else if (typeof value === "object") {
            obj[key] = removeEmptyNodes(value);
        }
    });
    return hasEmptyNodes ? removeEmptyNodes(obj) : obj;
}
