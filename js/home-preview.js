document.getElementById("homeSolutionsList").innerHTML = onecPrograms.slice(0, 3).map(programCardHTML).join("");
document.getElementById("homeIndustryGrid").innerHTML = industryCategories.slice(0, 3).map(industryCategoryMediaCardHTML).join("");
