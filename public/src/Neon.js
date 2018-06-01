function Neon (params) {

    //////////////
    // Constructor
    //////////////

    // Width/Height needs to be set based on MEI information in the future
    var pageWidth = 600;
    var pageHeight = 800;

    var vrvToolkit = new verovio.toolkit();
    var fileName = params.meifile;
    var bgimg = fileName.split('.', 2)[0] + ".png";
    
    // Set up handlers for zoom, info box, etc.
    var zoomhandler = new ZoomHandler(this);
    var infobox = new InfoBox(vrvToolkit);
    var controls = new Controls(zoomhandler);

    var vrvOptions = {
        pageWidth: pageWidth,
        pageHeight: pageHeight,
        noFooter: 1,
        noHeader: 1,
        scale: 50
    };
    vrvToolkit.setOptions(vrvOptions);
    
    $.get("/uploads/mei/" + fileName, function(data) {
        loadData(data);
    });

    // Set keypress listener
    // Panning behaviour only when shift is pressed
    d3.select("body")
        .on("keydown", keydownListener)
        .on("keyup", () => {
            if (d3.event.key == "Shift") {
                d3.select("body").on(".drag", null);
            }
        });


    ////////////
    // Functions
    ////////////

    // Loads data into toolkit and also loads the image & mei svg data
    function loadData (data) {
        vrvToolkit.loadData(data);
        loadImage();
        loadPage();
    }

    function loadImage () {
        var bgimg_layer = d3.select("#svg_output").append("svg")
            .attr("id", "svg_group")
            .attr("width", pageWidth)
            .attr("height", pageHeight)
            .attr("viewBox", '0 0 ' + pageWidth + " " + pageHeight);

        var bg = bgimg_layer.append("image")
            .attr("id", "bgimg")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", pageHeight)
            .attr("width", pageWidth)
            .attr("xlink:href", "/uploads/png/" + bgimg);

        bgimg_layer.append('g')
            .attr("id", "mei_output");
    }

    function loadPage () {
        var svg = vrvToolkit.renderToSVG(1);
        $("#mei_output").html(svg);
        d3.select("#mei_output").select("svg").attr("id", "svg_container");
        infobox.infoListeners();
    }

    function refreshPage () {
        var meiData = vrvToolkit.getMEI();
        loadData(meiData);
        zoomhandler.restoreTransformation();
    }

    // function saveMEI() {
    //     var meiData = vrvToolkit.getMEI();
    //     $.ajax({
    //         type: "POST",
    //         url: "/save/" + fileName,
    //         data: {"meiData": meiData,
    //                 "fileName": fileName}
    //     }) 
    // }

    // Handles key presses for Neon2
    function keydownListener () {
        var unit = 10;
        switch (d3.event.key) {
            case "Shift":
                d3.select("body").call(
                    d3.drag()
                        .on("start", zoomhandler.startDrag)
                        .on("drag", zoomhandler.dragging)
                );
                break;
            // case "s":
            //     saveMEI();
            //     break;
            case "z":
                zoomhandler.zoom(1.25);
                break;
            case "Z":
                zoomhandler.zoom(0.80);
                break;
            default: break;
        }
    }
    
    // Constructor reference
    Neon.prototype.pageWidth = pageWidth;
    Neon.prototype.pageHeight = pageHeight;

    Neon.prototype.constructor = Neon;
    Neon.prototype.loadData = loadData;
    Neon.prototype.loadPage = loadPage;
    Neon.prototype.refreshPage = refreshPage;
    //Neon.prototype.saveMEI = saveMEI;
}

