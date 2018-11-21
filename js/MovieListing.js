// This is the main function that is called everytime to call the Movie API
function callAPI(url, callback) {
    var currentFile = new XMLHttpRequest();
    var allText = "",
        inputStr = "";
    currentFile.onreadystatechange = function() {
        if (currentFile.readyState === 4) {
            if (currentFile.status === 200 || currentFile.status == 0) {
                allText = currentFile.responseText;
                var jsonStr = JSON.parse(allText);
                callback(jsonStr);
            } else {
                alert(currentFile.status + ": " + currentFile.responseText);
            }
        }
    }
    currentFile.open("GET", url, true);
    currentFile.send();
}

var checkboxArray = [];
// this is not working as expected as its not filtering for all (didn't have enough time to fix it :( )
function updateMovieList(genreValues) {
    // Genre Filtering
    var A = [];
    var grid = $("#popularMoviesGrid").data("kendoGrid");
    var localDataSource = grid.dataSource;

    for(var i = 0; i < genreValues.length; i++) {
        A.push({ field: "genreNames", operator: "contains", value: genreValues[i] });
    }
    
    localDataSource.filter(A);
    grid.refresh();
}

// This function updates the grid as the slider is moved
function updateMovieListByRating(ratingValue) {
    var A = [];
    var grid = $("#popularMoviesGrid").data("kendoGrid");
    var localDataSource = grid.dataSource;
    A.push({ field: "vote_average", operator: "gte", value: ratingValue });
    localDataSource.filter(A);
    grid.refresh();
}

// This function handles the slider on change event for the rating
function sliderOnChange(e) {
    updateMovieListByRating(e.value);
}

// Self invoking function to start loading the contents on the web page
(function() {
//function LoadMovieListings() {
    var apiKey = "78905ac5ec561fa73fcbbc30ce14a016",
        language = "en-US";
    document.getElementsByClassName("fileButton").innerHTML = "";

    // First load all genres, then all movies and then start querying information
    callAPI("https://api.themoviedb.org/3/genre/movie/list?api_key=" + apiKey + "&language=" + language, function(genres) {
        var allGenres = genres["genres"];

        // Clear all the elements first in case the user clicks on the button again
        $("#checkboxes").empty();

        // Creating dynamic checkboxes based on the genres available
        $.each(allGenres, function () {
            $("#checkboxes").append($("<label>").text(this.name).prepend(
                $("<input>").attr('type', 'checkbox').val(this.name)
                   .prop('checked', this.checked)
            ));
        });

        $("#checkboxes").on('change', '[type=checkbox]', function () {
           //this is now the checkbox; this.value is the name.
           if($(this).is(':checked')) {
                checkboxArray.push(this.value); 
           }
           else {
                // remove value from the checkboxarray
                var index = checkboxArray.indexOf(this.value);
                if (index !== -1)
                    checkboxArray.splice(index, 1);
           }
           
           updateMovieList(checkboxArray);
        });

        // Creating a key value pair for genres based on their ID's
        var genresJsonObj = {};
        
        for(var k = 0; k < allGenres.length; k++) {
            var currentIndex = allGenres[k]["id"];
            genresJsonObj[currentIndex] = {};
            genresJsonObj[currentIndex] = allGenres[k]["name"];
        }

        callAPI("https://api.themoviedb.org/3/movie/now_playing?api_key=" + apiKey + "&language=" + language + "&page=1", function(movies) {
            var allMovies = movies;
            
            for(var i = 0; i < allMovies["results"].length; i++) {
                
                //console.log(allMovies["results"][i]["genre_ids"]);
                var genreList = allMovies["results"][i]["genre_ids"];
                var genreNames = [];
                for(var j = 0; j < genreList.length; j++) {
                    genreNames.push(genresJsonObj[genreList[j]]);
                }
                allMovies["results"][i]["genreNames"] = genreNames.join(" / ");
            }


            var localDataSource = new kendo.data.DataSource({
                data: allMovies["results"],
                pageSize: 20
            });

            var grid = $("#popularMoviesGrid").kendoGrid({
                dataSource: localDataSource,
                height: 550,
                rowTemplate: kendo.template($("#rowTemplate").html()),
                scrollable: true,
                sortable: true,
                // filterable: true,
                pageable: {
                    input: true,
                    numeric: false
                },
                columns: ["Now Playing"]
            }).data("kendoGrid");

            // This initiates the slider for the rating
            var slider = $("#slider").kendoSlider({
                change: sliderOnChange,
                increaseButtonTitle: "Right",
                decreaseButtonTitle: "Left",
                min: 0,
                max: 10,
                smallStep: 1,
                largeStep: 1
            }).data("kendoSlider");

            $(".filterHeading").show();
        });
    });
})();
