const nextButton = document.getElementById("next");
const backButton = document.getElementById("back");
const subSelect = document.getElementById("sub");
const img = document.getElementById("img");
const loading = document.getElementById("loading");

const LOADING_ERROR_URL = "https://jhusain.github.io/reddit-image-viewer/error.png";
const Observable = Rx.Observable;

// function which returns an array of image URLs for a given reddit sub
// getSubImages("pics") ->
// [
//   "https://upload.wikimedia.org/wikipedia/commons/3/36/Hopetoun_falls.jpg",
//   "https://upload.wikimedia.org/wikipedia/commons/3/38/4-Nature-Wallpapers-2014-1_ukaavUI.jpg",
//   ...
// ]
function getSubImages(sub) {
  const cachedImages = localStorage.getItem(sub);
  if (cachedImages) {
      return Observable.of(JSON.parse(cachedImages));
  }
  else {
    const url = `https://www.reddit.com/r/${sub}/.json?limit=200&show=all`;

    // defer ensure new Observable (and therefore) promise gets created
    // for each subscription. This ensures functions like retry will
    // issue additional requests.
    return Observable.defer(() =>
      Observable.fromPromise(
        fetch(url).
          then(res => res.json()).
          then(data => {
            const images = data.data.children
                .filter(image => image.data.url.indexOf('.jpg') !== -1)
                .map(image => image.data.url);

            localStorage.setItem(sub, JSON.stringify(images));

            return images;
          })));
  }
}

// ---------------------- INSERT CODE  HERE ---------------------------
// This "images" Observable is a dummy. Replace it with a stream of each
// image in the current sub which is navigated by the user.
// const images = Observable.of("https://upload.wikimedia.org/wikipedia/commons/3/36/Hopetoun_falls.jpg");
//
// images.subscribe({
//   next(url) {
//     // hide the loading image
//     loading.style.visibility = "hidden";
//
//     // set Image source to URL
//     img.src = url;
//   },
//   error(e) {
//     alert("I'm having trouble loading the images for that sub. Please wait a while, reload, and then try again later.")
//   }
// });

// This "actions" Observable is a placeholder. Replace it with an
// observable that notfies whenever a user performs an action,
// like changing the sub or navigating the images
// const actions = Observable.empty();
//
// actions.subscribe(() => loading.style.visibility = "visible");

const nextButtonClick$ = Observable.fromEvent(nextButton, 'click'); // getImages and take current one

const backButtonClick$ = Observable.fromEvent(backButton, 'click'); //  getImages and take previous one
const subSelectChange$ = Observable.concat(
    Observable.of(subSelect.value),
    Observable.fromEvent(subSelect, 'change').map(e => e.target.value) // get images again and reset counter
);

const actions$ = Observable.merge(
    nextButtonClick$,
    backButtonClick$,
    subSelectChange$
);

const offset$ = Observable.merge(
    backButtonClick$.map(() => -1),
    nextButtonClick$.map(() => 1)
);

const index$ = Observable.concat(
    Observable.of(0),
    offset$.scan((acc, curr) => acc + curr)
);

actions$.subscribe(() => loading.style.visibility = "visible");

images$ = subSelectChange$
    .map((selectedValue) => {
        return getSubImages(selectedValue).map(urlArr => {
            return  index$.map(index => urlArr[index])
        }).switch();
    })
    .switch()
    .subscribe({
        next(url) {
            // hide the loading image
            loading.style.visibility = "hidden";

            // set Image source to URL
            img.src = url;
        },
        error(e) {
            console.log(e);
            alert("I'm having trouble loading the images for that sub. Please wait a while, reload, and then try again later.")
        }
    });
