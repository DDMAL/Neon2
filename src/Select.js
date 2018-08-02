/** @module Select */

import * as Color from "./Color.js";
import * as Contents from "./Contents.js";
import * as Controls from "./Controls.js";
import * as Grouping from "./Grouping.js";
import * as SelectOptions from "./SelectOptions.js";

/**
 * Handle click selection and mark elements as selected.
 * @constructor
 * @param {DragHandler} dragHandler - An instantiated DragHandler object.
 * @param {NeonView} neonView - The NeonView parent.
 */
export function ClickSelect (dragHandler, zoomHandler, neonView, neon) {
    selectListeners();

    //Selection mode toggle
    function selectListeners() {
        var classesToSelect = "use, #svg_group";
        Controls.initSelectionButtons();

        //Activating selected neumes
        $(classesToSelect).off("mousedown", handler);
        $(classesToSelect).on("mousedown", handler);

        function handler(evt) {
            if (this.tagName === "use") {
                var isNc= $(this).parent().hasClass("nc");
                if(!isNc && !($("#selByStaff").hasClass("is-active"))){
                    if ($(this).parent().hasClass("clef")){
                        selectClefs(this, dragHandler);
                    }
                    else if($(this).parent().hasClass("custos")){
                        selectNcs(this, dragHandler, neon);
                    }
                }

                else if ($("#selBySyl").hasClass("is-active") && isNc) {
                    var ncParent = $(this).parent();
                    var neumeParent = $(this).parent().parent();
                    if($(neumeParent).hasClass("neume")){
                        var parentSiblings = Array.from($(neumeParent).siblings(".neume"));
                        if(parentSiblings.length != 0){
                            selectSyl(this, dragHandler);
                        }
                        else{
                            var ncSiblings = Array.from($(ncParent).siblings(".nc"));
                            if(ncSiblings != 0){
                                selectNeumes(this, dragHandler);
                            }
                            else{
                                selectNcs(this, dragHandler, neon);
                            }
                        }
                    }
                    else{
                        console.log("Error: parent should be neume.");
                    }
                }
                else if ($("#selByNeume").hasClass("is-active") && isNc){
                    var siblings = Array.from($(this).parent().siblings());
                    if(siblings.length != 0) {
                        selectNeumes(this, dragHandler);
                    }
                    else{
                        var ncSiblings = Array.from($(ncParent).siblings(".nc"));
                        if(ncSiblings != 0){
                            selectNeumes(this, dragHandler);
                        }
                        else{
                            selectNcs(this, dragHandler, neon);
                        }  
                    }
                }
                else if ($("#selByNc").hasClass("is-active") && isNc){
                    selectNcs(this, dragHandler, neon);
                }
                else if ($("#selByStaff").hasClass("is-active")) {
                    var staff = $(this).parents(".staff");
                    if (!staff.hasClass("selected")) {
                        unselect();
                        staff.addClass("selected");
                        Color.highlight(staff[0], "#d00");
                        SelectOptions.triggerStaffActions();
                        dragHandler.dragInit();
                    }
                }
                else {
                    console.log("error: selection mode not activated");
                    return;
                }
            }
            else {
                if (!$("#selByStaff").hasClass("is-active")) {
                    return;
                }
                // Check if point is in staff.
                let staves = Array.from($(".staff"));
                var container = document.getElementsByClassName("definition-scale")[0];
                let pt = container.createSVGPoint();
                pt.x = evt.clientX;
                pt.y = evt.clientY;
                let transformMatrix = container.getScreenCTM();
                pt = pt.matrixTransform(transformMatrix.inverse());

                let selectedStaves = staves.filter((staff) => {
                    var ulx, uly, lrx, lry;
                    (Array.from($(staff).children("path"))).forEach(path => {
                        let box = path.getBBox();
                        if (uly === undefined || box.y < uly) {
                            uly = box.y;
                        }
                        if (ulx === undefined || box.x < ulx) {
                            ulx = box.x;
                        }
                        if (lry === undefined || box.y + box.height > lry) {
                            lry = box.y + box.height;
                        }
                        if (lrx === undefined || box.x + box.width > lrx) {
                            lrx = box.x + box.width;
                        }
                    });
                    return (ulx < pt.x && pt.x < lrx) && (uly < pt.y && pt.y < lry);
                });
                if (selectedStaves.length != 1) {
                    unselect();
                    return;
                }

                var staff = selectedStaves[0];
                if (!$(staff).hasClass("selected")) {
                    unselect();
                    $(staff).addClass("selected");
                    Color.highlight(staff, "#d00");
                    SelectOptions.triggerStaffActions();
                    dragHandler.dragInit();
                }
            }
        }

        // click away listeners
        $("body").on("keydown", (evt) => { // click
            if (evt.type === "keydown" && evt.key !== "Escape") return;
            SelectOptions.endOptionsSelection();
            unselect();
        })

        $(classesToSelect).on("click", function(e){
            e.stopPropagation();
        })

        $("#moreEdit").on("click", function(e) {
            e.stopPropagation();
        })
    }
    ClickSelect.prototype.selectListeners = selectListeners;
}

/**
 * Handle dragging to select musical elements and staves.
 * @constructor
 * @param {DragHandler} dragHandler - Instantiated DragHandler object.
 * @param {module:Zoom~ZoomHandler} zoomHandler - Instantiated ZoomHandler object.
 * @param {NeonView} neonView - NeonView parent.
 */
export function DragSelect (dragHandler, zoomHandler, neonView, neon) {
    var initialX = 0;
    var initialY = 0;
    var panning = false;
    var dragSelecting = false;

    var canvas = d3.select("#svg_group");

    canvas.call(
        d3.drag()
            .on("start", selStart)
            .on("drag", selecting)
            .on("end", selEnd)
    );

    /**
     * Start drag selecting musical elements.
     */
    function selStart(){
        var editing = false;
        var insertEls = Array.from(d3.selectAll(".insertel")._groups[0]);
        insertEls.forEach(el => {
            if ($(el).hasClass("is-active")){
                editing = true;
            }
        })
        if (d3.event.sourceEvent.target.nodeName != "use" && !editing){
            if(!d3.event.sourceEvent.shiftKey){
                if (!$("#selByStaff").hasClass("is-active") || pointNotInStaff(d3.mouse(this))) {
                    unselect();
                    dragSelecting = true;
                    var initialP = d3.mouse(this);
                    initialX = initialP[0];
                    initialY = initialP[1];
                    initRect(initialX, initialY);
                }
            }
            else {
                panning = true;
                zoomHandler.startDrag();
            }
        }
        else if (d3.event.sourceEvent.shiftKey) {
            panning = true;
            zoomHandler.startDrag();
        }
        editing = false;
    }

    function pointNotInStaff(point) {
        let staves = Array.from($(".staff"));
        let filtered = staves.filter((staff) => {
            var ulx, uly, lrx, lry;
            (Array.from($(staff).children("path"))).forEach(path => {
                let box = path.getBBox();
                if (uly === undefined || box.y < uly) {
                    uly = box.y;
                }
                if (ulx === undefined || box.x < ulx) {
                    ulx = box.x;
                }
                if (lry === undefined || box.y + box.height > lry) {
                    lry = box.y + box.height;
                }
                if (lrx === undefined || box.x + box.width > lrx) {
                    lrx = box.x + box.width;
                }
            });
            return (ulx < point[0] && point[0] < lrx) && (uly < point[1] && point[1] < lry);
        });
        return (filtered.length == 0);
    }

    /**
     * Action to run while the drag select continues. Updates the rectangle.
     */
    function selecting(){
        if(!panning && dragSelecting){
            var currentPt = d3.mouse(this);
            var curX = currentPt[0];
            var curY = currentPt[1];

            var newX = curX<initialX?curX:initialX;
            var newY = curY<initialY?curY:initialY;
            var width = curX<initialX?initialX-curX:curX-initialX;
            var height = curY<initialY?initialY-curY:curY-initialY;

            updateRect(newX, newY, width, height);
        }
        else if(panning){
            zoomHandler.dragging();
        }
    }

    /**
     * Finish the selection and mark elements within the rectangle as being selected.
     */
    function selEnd(){
        if(!panning && dragSelecting){
            var rx = parseInt($("#selectRect").attr("x"));
            var ry = parseInt($("#selectRect").attr("y"));
            var lx = parseInt($("#selectRect").attr("x")) + parseInt($("#selectRect").attr("width"));
            var ly = parseInt($("#selectRect").attr("y")) + parseInt($("#selectRect").attr("height"));

            var nc;
            if ($("#selByStaff").hasClass("is-active")) {
                nc = d3.selectAll("use, .staff")._groups[0];
            } else {
                nc = d3.selectAll("use")._groups[0];
            }
            var els = Array.from(nc);

            var elements = els.filter(function(d){
                var elX, elY;
                if (d.tagName === "use") {
                    elX = d.x.baseVal.value;
                    elY = d.y.baseVal.value;
                    return elX > rx && elX < lx  && elY > ry && elY < ly;
                } else {
                    var uly, ulx, lry, lrx;
                    (Array.from($(d).children("path"))).forEach(path => {
                        let box = path.getBBox();
                        if (uly === undefined || box.y < uly) {
                            uly = box.y;
                        }
                        if (ulx === undefined || box.x < ulx) {
                            ulx = box.x;
                        }
                        if (lry === undefined || box.y + box.height > lry) {
                            lry = box.y + box.height;
                        }
                        if (lrx === undefined || box.x + box.width > lrx) {
                            lrx = box.x + box.width;
                        }
                    });
                    return !(((rx < ulx && lx < ulx) || (rx > lrx && lx > lrx)) || ((ry < uly && ly < uly) || (ry > lry && ly > lry)));
                }
            });

            var syls = [];
            var neumes = [];
            var ncs = [];
            var notNeumes = [];

            elements.forEach(el => {
                var firstParent = $(el).parent()[0];
                var isNc = $(firstParent).hasClass("nc");

                if (isNc) {
                    ncs.push(firstParent);

                    var neume = $(firstParent).parent()[0];
                    if (!neumes.includes(neume)) {
                        neumes.push(neume);
                    }

                    var syl = $(neume).parent()[0];
                    if (!syls.includes(syl)) {
                        syls.push(syl);
                    }
                }
                else {
                    notNeumes.push(firstParent);
                }
            });

            var selectMode = null;
            var tabs = Array.from($(".sel-by"));
            tabs.forEach(tab => {
                if ($(tab).hasClass("is-active")) {
                    selectMode = $(tab)[0].id;
                }
            });

            if (selectMode == "selByStaff") {
                var toSelect = [];
                elements.forEach(el => {
                    if (el.tagName === "use") {
                        toSelect.push($(el).parents(".staff")[0]);
                    } else {
                        toSelect.push(el);
                    }
                });
                toSelect.forEach(elem => {
                    Color.highlight(elem, "#d00");
                    $(elem).addClass("selected");
                });
                SelectOptions.triggerStaffActions();
            }
            else if (selectMode === "selBySyl") {
                var noClefOrCustos = selectNn(notNeumes);
                syls.forEach(s => {
                    select(s);
                });
                if(!noClefOrCustos){
                    if(notNeumes.length == 1 && ncs.length == 0){
                        var el = notNeumes[0];
                        // if($(el).hasClass("custos")){
                        //     SelectOptions.triggerNcActions([el]);
                        // }
                        if($(el).hasClass("clef")){
                            SelectOptions.triggerClefActions([el]);
                        }
                    }
                }
                else if (syls.length > 1 && noClefOrCustos) {
                    Grouping.triggerGrouping("syl");
                }
                else if (syls.length === 1 && noClefOrCustos) {
                    var syl = syls[0];
                    var nmChildren = $(syl).children(".neume");
                    if(nmChildren.length === 1){
                        var neume = nmChildren[0];
                        var ncChildren = $(neume).children();
                        if(ncChildren.length === 1){
                            unselect();
                            select(ncChildren[0]);
                            SelectOptions.triggerNcActions(ncChildren[0]);
                        }
                        else{
                            unselect();
                            select(neume);
                            SelectOptions.triggerNeumeActions();
                        }
                    }
                    else{
                        SelectOptions.triggerSylActions();
                    }
                }
                else {
                    console.log("Warning: no selection made");
                }
            }
            else if (selectMode === "selByNeume") {
                var noClefOrCustos = selectNn(notNeumes);
                neumes.forEach(n => {
                    select(n);
                });
                if(!noClefOrCustos){
                    if(notNeumes.length == 1 && ncs.length == 0){
                        var el = notNeumes[0];
                        // if($(el).hasClass("custos")){
                        //     SelectOptions.triggerNcActions([el]);
                        // }
                        if($(el).hasClass("clef")){
                            SelectOptions.triggerClefActions([el]);
                        }
                    }
                }
                else if (neumes.length > 1 && noClefOrCustos) {
                    Grouping.triggerGrouping("neume");
                }
                else if (neumes.length == 1 && noClefOrCustos) {
                    var neume = neumes[0];
                    var ncChildren = $(neume).children();
                    if(ncChildren.length == 1){
                        unselect();
                        select(ncChildren[0]);
                        SelectOptions.triggerNcActions(ncChildren[0]);
                    }
                    else{
                        SelectOptions.triggerNeumeActions();
                    }
                }
                else {
                    console.log("no selection made");
                }
            }
            else if (selectMode === "selByNc") {
                var noClefOrCustos = selectNn(notNeumes);
                ncs.forEach(nc => {
                    select(nc);
                });
                if(!noClefOrCustos){
                    if(notNeumes.length == 1 && ncs.length == 0){
                        var el = notNeumes[0];
                        // if($(el).hasClass("custos")){
                        //     SelectOptions.triggerNcActions([el]);
                        // }
                        if($(el).hasClass("clef")){
                            SelectOptions.triggerClefActions([el]);
                        }
                    }
                }
                else if (ncs.length === 2 && noClefOrCustos) {
                    var firstX = $(ncs[0]).children()[0].x.baseVal.value;
                    var secondX = $(ncs[1]).children()[0].x.baseVal.value;
                    var firstY = 0;
                    var secondY = 0;

                    if(firstX == secondX){
                        firstY = $(ncs[1]).children()[0].y.baseVal.value;
                        secondY = $(ncs[0]).children()[0].y.baseVal.value;
                    }
                    else{
                        firstY = $(ncs[0]).children()[0].y.baseVal.value;
                        secondY = $(ncs[1]).children()[0].y.baseVal.value;
                    }

                    if(secondY > firstY){
                        if($(ncs[0]).parent()[0].id === $(ncs[1]).parent()[0].id){
                            if(isLigature($(ncs[0]), neon) && isLigature($(ncs[1]), neon)){
                                Grouping.triggerGrouping("ligature");
                            }
                            else{
                                Grouping.triggerGrouping("ligatureNc");
                            }
                        }
                        else{
                            Grouping.triggerGrouping("nc");
                        }
                    }
                    else{
                        Grouping.triggerGrouping("nc");
                    }
                }
                else if (ncs.length > 1 && noClefOrCustos) {
                    Grouping.triggerGrouping("nc");
                }
                else if (ncs.length === 1 && noClefOrCustos) {
                    SelectOptions.triggerNcActions(ncs[0]);
                }
                else {
                    console.log("Warning: no selection made");
                }
            }
            dragHandler.dragInit();
            d3.selectAll("#selectRect").remove();
            dragSelecting = false;
        }
        panning = false;
    }

    /**
     * Create an initial dragging rectangle.
     * @param {number} ulx - The upper left x-position of the new rectangle.
     * @param {number} uly - The upper left y-position of the new rectangle.
     */
    function initRect(ulx, uly){
        canvas.append("rect")
            .attr("x", ulx)
            .attr("y", uly)
            .attr("width", 0)
            .attr("height", 0)
            .attr("id", "selectRect")
            .attr("stroke", "black")
            .attr("stroke-width", 7)
            .attr("fill", "none");
    }

    /**
     * Update the dragging rectangle.
     * @param {number} newX - The new ulx.
     * @param {number} newY - The new uly.
     * @param {number} currentWidth - The width of the rectangle in pixels.
     * @param {number} currentHeight - The height of the rectangle in pixels.
     */
    function updateRect(newX, newY, currentWidth, currentHeight){
        d3.select("#selectRect")
            .attr("x", newX)
            .attr("y", newY)
            .attr("width", currentWidth)
            .attr("height", currentHeight)
    }

    /**
     * Select not neume elements.
     * @param {object[]} notNeumes - An array of not neumes elements.
     */
    function selectNn(notNeumes) {
        if (notNeumes.length > 0) {
            notNeumes.forEach(nn => {
                select(nn);
            });
            return false;
        } else {
            return true;
        }
    }
}

/**
 * Unselect all selected elements and run undo any extra
 * actions.
 */
export function unselect() {
    var selected = $(".selected");
    for (var i=0; i < selected.length; i++) {
        if ($(selected[i]).hasClass("staff")) {
            $(selected[i]).removeClass("selected");
            Color.unhighlight(selected[i]);
        } else {
            $(selected[i]).removeClass("selected").attr("fill", null);
        }
    }
    if (!$("#selByStaff").hasClass("is-active")) {
        Grouping.endGroupingSelection();
    }
    Controls.updateHighlight();
}

/**
 * Generic select function.
 */
function select(el) {
    if (!$(el).hasClass("selected")) {
        $(el).attr("fill", "#d00");
        $(el).addClass("selected");
    }
}

/**
 * Select a syllable.
 * @param {SVGSVGElement} el - The nc element whose syllable to select.
 * @param {DragHandler} dragHandler - An instantiated DragHandler.
 */
function selectSyl(el, dragHandler) {
    if(!$(el).parent().parent().parent().hasClass("selected")){
        unselect();
        select($(el).parent().parent().parent());
        SelectOptions.triggerSylActions();
        dragHandler.dragInit();
    }
}

/**
 * Select a neume.
 * @param {SVGSVGElement} el - The nc element whose neume to select.
 * @param {DragHandler} dragHandler - An instantiated DragHandler.
 */
function selectNeumes(el, dragHandler) {
    if(!$(el).parent().parent().hasClass("selected")){
        unselect();
        select($(el).parent().parent());
        SelectOptions.triggerNeumeActions();
        dragHandler.dragInit();
    }
}

/**
 * Select an nc.
 * @param {SVGSVGElement} el - The nc element to select.
 * @param {DragHandler} dragHandler - An instantiated DragHandler.
 */
function selectNcs(el, dragHandler, neon) {
    if(!$(el).parent().hasClass("selected")){   
        var parent = $(el).parent();
        unselect();
        select(parent);
        if(isLigature(parent, neon)){
            var prevNc = $(parent).prev();
            if(isLigature(prevNc, neon)){
                select(prevNc);
            }
            else{
                var nextNc = $(parent).next();
                if(isLigature(nextNc, neon)){
                    select(nextNc);
                }
                else{
                    console.warn("Error: Neither prev or next nc are ligatures");
                }
            }
            Grouping.triggerGrouping("ligature");
        }
        else if(parent.hasClass("nc")){
            SelectOptions.triggerNcActions(parent[0]);
        }
        else{
            console.warn("No action triggered!");
        }
        dragHandler.dragInit();
    }
}

/**
 * Select a clef.
 * @param {SVGSVGElement} el - The clef element to select.
 * @param {DragHandler} dragHandler - An instantiated DragHandler.
 */
function selectClefs(el, dragHandler){
    if(!$(el).parent().hasClass("selected")){
        var parent = $(el).parent();
        unselect();
        select(parent);
        SelectOptions.triggerClefActions(parent[0]);
        dragHandler.dragInit();
    }
}

/**
 * Check if neume component is part of a ligature
 * @param {*} nc - The neume component to check.
 * @param {*} neon - An instantiated Neon.
 */
function isLigature(nc, neon){
    var attributes = neon.getElementAttr(nc[0].id);
    if(attributes.ligature == "true") return true;
    return false;
}


