let mood = 0;
let count = 0;

let res = document.querySelector("#res");
let sender = document.querySelector("#sender");


function resizeImage(img) {
    if(img.style.width !== "300px")
    {
        img.style.width = "376px";
        img.style.height = "240px";
        img.style.opacity = 0.7;
        count++;
    }
    else
    {
        img.style.width = "470px";
        img.style.height = "300px";
        img.style.opacity = 1;
        count--;
    }
}

let images = document.querySelectorAll(".image-slide");
images.forEach(element => {
    element.addEventListener("click", () => {
        if(element.style.width !== "427px")
        {
            element.style.width = "427px";
            element.style.height = "270px";
            element.style.marginLeft = "21.5px";
            element.style.marginTop = "15px";
            mood = mood*count;
            mood += parseFloat(element["id"]);
            count++;
            mood /= count;
            res.value = mood.toFixed(3).toString();
        }
        else
        {
            element.style.width = "470px";
            element.style.height = "300px";
            element.style.marginLeft = "0px";
            element.style.marginTop = "0px";
            mood *= count;
            mood -= parseFloat(element["id"])
            count--;
            if(count !== 0){
                mood /= parseFloat(count);
                res.nodeValue = mood.toFixed(3).toString();
            }
            else{
                mood = 0;
                res.value = mood.toFixed(3).toString();
            }
        }
        console.log(count);
        console.log(mood.toFixed(3));
    });
});

sender.addEventListener("onsubmit", () => console.log(res));