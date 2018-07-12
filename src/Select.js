export default function Select (dragHandler) {
    selectListeners();
    //Selection mode toggle
    function selectListeners() {
        var classesToSelect = ".nc, .clef, .custos";
        $("#selByNeume").on("click", function(){
            if ($("#selByNc").hasClass("is-active")){
                $("#selByNc").toggleClass('is-active');
                $("#selByNeume").toggleClass('is-active');
            }           
        });

        $("#selByNc").on("click", function(){
            if ($("#selByNeume").hasClass("is-active")){
                $("#selByNeume").toggleClass('is-active');
                $("#selByNc").toggleClass('is-active');
            } 
        });

        //Activating selected neumes
        $(classesToSelect).on("mousedown", function() {
            var isNc= $(this).hasClass("nc");
            if ($("#selByNeume").hasClass("is-active") && isNc){
                if(!$(this).hasClass("selected")){
                    unselect();
                    $(this).attr("fill", "#d00");
                    $(this).addClass("selected");
                    var siblings = Array.from($(this).siblings());
                    siblings.forEach(el => {
                        if(!$(el).hasClass("selected")){
                            $(el).attr("fill", "#d00");
                            $(el).addClass("selected");
                        }   
                    }) 
                    if(siblings.length != 0){
                        triggerNeumeActions();  
                    }     
                    else{
                        triggerNcActions();
                    }          
                    dragHandler.dragInit();   
                }
            }
            else if ($("#selByNc").hasClass("is-active") || !isNc){
                if(!$(this).hasClass("selected")){
                    unselect();
                    $(this).attr("fill", "#d00");
                    $(this).addClass("selected");
                    triggerNcActions();
                    dragHandler.dragInit();
                }
            }
            else {
                console.log("error: selection mode not activated");
            }
        })

        // click away listeners
        $("body").on("click keydown", (evt) => {
            if (evt.type === "keydown" && evt.key !== "Escape") return;
            endOptionsSelection();
            unselect();
        })

        $(classesToSelect).on("click", function(e){
            e.stopPropagation();
        })

        $("#moreEdit").on("click", function(e) {
            e.stopPropagation();
        })

        function unselect() {
            var els = $(".selected");
            for (var i=0; i<els.length; i++){
                $(els[i]).removeClass("selected").attr("fill", null);
            }
        }
    }

    //TODO: CHANGE NAVABAR-LINK TO PROPER ICON//
    function triggerNcActions() {
        endOptionsSelection();
        $("#moreEdit").removeClass("is-invisible");
        $("#moreEdit").append(
            "<label>Change Head Shape:&nbsp;</label>" +
            "<div id='drop_select' class='dropdown'>" +
            "<div class='dropdown-trigger'>" +
            "<button id='select-options' class='button navbar-link' aria-haspopup='true' aria-controls='dropdown-menu'>" +
            "<span>Head Shapes</span><span class='icon is-small'>" +
            "<i class=''></i></span></button></div>" +
            "<div class='dropdown-menu' id='dropdown-menu' role='menu'>" +
            "<div class='dropdown-content'>" +
            "<a id='Punctum' class='dropdown-item'>Punctum</a>" +
            "<a id='Virga' class='dropdown-item'>Virga</a>" +
            "<a id='Inclinatum' class='dropdown-item'>Inclinatum</a></div></div></div>"
        );

        initOptionsListeners();
    }
    //TODO: CHANGE NAVABAR-LINK TO PROPER ICON//
    function triggerNeumeActions() {
        endOptionsSelection()
        $("#moreEdit").removeClass("is-invisible");
        $("#moreEdit").append(
            "<label>Change Grouping:&nbsp;</label>" +
            "<div id='drop_select' class='dropdown'>" +
            "<div class='dropdown-trigger'>" +
            "<button id='select-options' class='button navbar-link' aria-haspopup='true' aria-controls='dropdown-menu'>" +
            "<span>Groupings</span><span class='icon is-small'>" +
            "<i class=''></i></span></button></div>" +
            "<div class='dropdown-menu' id='dropdown-menu' role='menu'>" +
            "<div class='dropdown-content'>" +
            "<a id='Torculus' class='dropdown-item'>Torculus</a></div></div></div>" +
            "<div><p class='control'>" +
            "<button class='button' id='ungroup'>Ungroup</button></p></div>"
        );

        initOptionsListeners();
    }

    function endOptionsSelection () {
        $("#moreEdit").empty();
        $("#moreEdit").addClass("is-invisible");
    }

    function initOptionsListeners(){
        $("#drop_select").on("click", function() {
            $(this).toggleClass("is-active");
        })
    }

    Select.prototype.selectListeners = selectListeners;
}