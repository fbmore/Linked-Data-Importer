var sketch = require("sketch");

var ui = require('sketch/ui');

var DataSupplier = require("sketch/data-supplier");
var document = sketch.getSelectedDocument();
var selectedItem = document.selectedLayers.layers[0];
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

const dataName = normalizePaths(selectedItem.name) + ".json";

const sketchDataFolder = sketchDir + "/Linked-Data";
createFolder(sketchDataFolder);

// Setup the folder structure to export our data

const dataFolder = sketchDataFolder + "/Data-" + documentName;
const imagesFolder =
    dataFolder + "/Images-" + normalizePaths(selectedItem.name);
const imagesFolderForJSON = "/Images-" + normalizePaths(selectedItem.name);

createFolder(dataFolder);
createFolder(imagesFolder);

const exportOptions = {
    formats: "png",
    overwriting: true,
    output: imagesFolder,
};

export default function () {
    let images = {};

    if (document.selectedLayers.isEmpty) {
        sketch.UI.message("Please select at least 1 layer.");
        return;
    } else if (document.selectedLayers > 1) {
        sketch.UI.message("Please select maximum 1 layer.");
        return;
    } else if (
        selectedItem.type !== "Group" &&
        selectedItem.type !== "SymbolInstance" &&
        selectedItem.type !== "SymbolMaster"
    ) {
        sketch.UI.message(
            "Please select a Group, a Symbol Instance or a Symbol Source."
        );
        return;
    }

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

        let staticData = {"label": "Hello Francesco YAY 😀"}

        /// add input to paste the CSV

        var result = ""

        var alertTitle = "Import Linked Data from a CSV";
        var instructionalTextForInput = "👉 Paste CSV below:";
        var initialValue = "name,email\nFrancesco,fbmore@gmail.com"
      
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
      
      
        var goodQuotes = result.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
      
        // result = goodQuotes;
        // var array = result.split("\n")

        staticData = csvToJson(goodQuotes)

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
                "From your Preferences modal -> Data, you can access the folder that contains it.";

            sketch.UI.alert("Link Data extraction complete", message);

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
                "⛔️ There was an error writing your file on Desktop"
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
 function csvToJson(text, headers, quoteChar = '"', delimiter = ',') {
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
