import Notiflix from 'notiflix';

/*
  Funkcja fetchImages pobiera obrazy z API Pixabay na podstawie zadanego zapytania i wyświetla powiadomienia za pomocą biblioteki Notiflix.
  Pobiera parametry zapytania wyszukiwania, numer strony i liczbę obrazów na stronę i zwraca obietnicę, która rozwiązuje się z danymi obrazu lub odrzuca z błędem.
*/

export const fetchImages = (name, page = 1, perPage = 40) => {
  const url = `https://pixabay.com/api/?key=34880786-eb7cfd58b108d519b70562252&q=${name}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=${perPage}`;
  Notiflix.Notify.info(`Fetching images for "${name}"...`);
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        if (response.status === 429) {
          // Too Many Requests
          
          Notiflix.Notify.warning('Too many requests. Please try again later.');
        }
        return Promise.reject(new Error(response.status));
      }
      return response.json();
    })
    .then(data => {
      const totalHits = data.totalHits;
      Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
      return data;
    })
    .catch(error => {
      console.error(error);
      return Promise.reject(
        new Error('An error occurred while fetching the data.')
      );
    });
};

//export { fetchImages };