import './css/styles.css';
import { fetchImages } from './fetchImages';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const searchForm = document.querySelector('#search-form');
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more');

let currentPage = 1;
let currentQuery = '';

// Tworzy nową instancję SimpleLightbox i stosuje ją 
//do wszystkich elementów zakotwiczonych wewnątrz elementów z klasą „fotografia”,
// używając tekstu alternatywnego jako podpisów z opóźnieniem 250 ms.
let lightbox = new SimpleLightbox('.photo-card a', {
  captions: true,
  captionsData: 'alt',
  captionDelay: 250,
});

/*
  Odbiornik zdarzeń searchForm jest wyzwalany, gdy użytkownik przesyła formularz wyszukiwania.
  Zapobiega domyślnemu zachowaniu przesyłania formularza, pobiera wartość zapytania wyszukiwania,
  resetuje bieżącą stronę do 1, czyści zawartość galerii i pobiera obrazy na podstawie zapytania wyszukiwania.
  Jeśli nie zostaną znalezione żadne obrazy, zostanie wyświetlony komunikat o błędzie za pomocą Notiflix.
  W przeciwnym razie renderuje listę obrazów i wyświetla przycisk ładowania więcej.
*/
searchForm.addEventListener('submit', async e => {
  e.preventDefault();
  const searchQuery = e.target.elements.searchQuery.value.trim(); // Wyodrębnia wartość zapytania wyszukiwania z formularza
  if (!searchQuery) {
    // Sprawdza, czy zapytanie wyszukiwania jest puste
    return;
  }

  currentPage = 1; // Resetuje bieżący numer strony do 1
  currentQuery = searchQuery; // Ustawia bieżące zapytanie wyszukiwania na wyodrębnioną wartość
  gallery.innerHTML = ''; // Usuwa poprzednie wyniki wyszukiwania z kontenera galerii
  await fetchImages(searchQuery)
    .try(data => {
      if (data.hits.length === 0) {
        throw new Error('No images found');
      }
      renderList(data.hits); // Renderuje pobrane obrazy do kontenera galerii
      loadMoreBtn.classList.remove('is-hidden'); // Pokazuje przycisk ładowania więcej


      /*
        Ten kod sprawdza, czy łączna liczba działań zwróconych przez interfejs API jest większa niż bieżąca strona pomnożona przez 40.
        Jeśli tak, dołącza obserwatora do przycisku „Załaduj więcej”, aby wykryć, kiedy przycisk jest widoczny na ekranie.
        Gdy przycisk jest widoczny, uruchamia funkcję, aby załadować więcej obrazów z interfejsu API. Usunięcie komentarza włączy tę funkcję.
      */

      // if (data.totalHits > currentPage * 40) {
      //   observer.observe(loadMoreBtn);
      // }
    })
    .catch(error => {
      console.error(error);
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    });
});

/*
  Funkcja detektora zdarzeń loadMoreBtn odpowiada za załadowanie dodatkowych obrazków w odpowiedzi na kliknięcie przez użytkownika przycisku „ładuj więcej”.
  Po kliknięciu przycisku zmienna currentPage jest zwiększana o 1 i wywoływana jest funkcja fetchImages() z bieżącym zapytaniem wyszukiwania i numerem strony jako argumentami.
  Jeśli wywołanie API powiedzie się, nowe obrazy są dołączane do kontenera galerii za pomocą funkcji renderList().
  Metoda Gallery.scrollIntoView() jest następnie używana do płynnego przewijania użytkownika do dołu strony, gdzie znajdują się nowo załadowane obrazy.
  Jeśli łączna liczba wyników wyszukiwania jest mniejsza lub równa currentPage * 40,
  czyli wszystkie dostępne wyniki zostały załadowane, przycisk "załaduj więcej" jest ukryty,
  a użytkownik jest powiadamiany komunikatem informacyjnym za pomocą funkcji Notiflix.Notify.info().
  Jeśli podczas wywołania API wystąpi błąd, użytkownik jest powiadamiany komunikatem o błędzie za pomocą funkcji Notiflix.Notify.failure().
  Ogólnie rzecz biorąc, ta funkcja pozwala użytkownikowi załadować więcej obrazów i przewijać wyniki, poprawiając komfort korzystania z funkcji wyszukiwania.
 */
loadMoreBtn.addEventListener('click', () => {
  currentPage += 1;
  fetchImages(currentQuery, currentPage)
    .then(data => {
      renderList(data.hits);
      gallery.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
      if (data.totalHits <= currentPage * 40) {
        loadMoreBtn.classList.add('is-hidden');
        Notiflix.Notify.info(
          "We're sorry, but you've reached the end of search results."
        );
      }
    })
    .catch(error => {
      Notiflix.Notify.failure(
        'Sorry, there was an error while fetching images. Please try again'
      );
    });
});

/*
Funkcja renderList pobiera dane odpowiedzi z wywołania API i renderuje je do galerii.
  Funkcja tworzy ciąg znaczników, mapując dane i używając właściwości obrazu do tworzenia elementów HTML dla każdego obrazu.
  Następnie wstawia znaczniki do elementu galerii za pomocą metody insertAdjacentHTML.
  Po wstawieniu kodu HTML funkcja odświeża SimpleLightbox, aby upewnić się, że wszystkie nowe obrazy zostaną uwzględnione w lightboxie.
  Na koniec funkcja smooth przewija stronę w dół, aby wyświetlić nowo dodane obrazy.
  Ogólnie rzecz biorąc, ta funkcja zajmuje się renderowaniem nowych obrazów w galerii i zapewnia, że ​​SimpleLightbox jest na bieżąco z najnowszymi obrazami.
*/
const renderList = data => {
  const markup = data
    .map(
      ({
        largeImageURL,
        webformatURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) =>
        `<div class="photo-card"> 
        <a href="${largeImageURL}">
      <img src="${webformatURL}" alt="${tags}" loading="lazy"/> 
      <div class="info"> 
        <p class="info-item"> 
          <b>Likes:</b> ${likes} 
        </p> 
        <p class="info-item"> 
          <b>Views:</b> ${views} 
        </p> 
        <p class="info-item"> 
          <b>Comments:</b> ${comments} 
        </p> 
        <p class="info-item"> 
          <b>Downloads:</b> ${downloads} 
        </p> 
      </div> 
  </div>`
    )
    .join('');

  gallery.insertAdjacentHTML('beforeend', markup);

  // Odświeża SimpleLightbox o nowe elementy
  lightbox.refresh();

  //Umożliwia płynne przewijanie poprzez przewinięcie strony o dwukrotność wysokości pierwszego elementu galerii

  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
};

const options = {
  rootMargin: '0px',
  threshold: 0.5,
};

/*
  Ta funkcja tworzy IntersectionObserver, który obserwuje, czy przycisk „ładuj więcej” jest widoczny i uruchamia funkcję fetchImages, aby załadować więcej obrazów, gdy jest.
  Obserwator jest inicjowany z opcjami definiującymi margines główny i próg wyzwalania przecięcia.
  Kiedy przycisk jest widoczny, zmienna currentPage jest zwiększana i wykonywane jest nowe wywołanie fetchImages z bieżącym zapytaniem i bieżącym numerem strony.
  Jeśli nie ma więcej obrazów do załadowania, obserwator przestaje obserwować przycisk i informuje użytkownika, że ​​dotarł do końca wyników wyszukiwania.
  Jeśli podczas pobierania obrazów wystąpi błąd, użytkownik zostanie o tym powiadomiony komunikatem o błędzie.
  
   Obserwator jest aktywowany przez usunięcie komentarza z funkcji searchForm.addEventListener, gdzie jest on dołączony do elementu loadMoreBtn. 
*/


const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      currentPage += 1;
      fetchImages(currentQuery, currentPage)
        .then(data => {
          renderList(data.hits);
          if (data.totalHits <= currentPage * 40) {
            loadMoreBtn.classList.add('is-hidden');
            Notiflix.Notify.info(
              "We're sorry, but you've reached the end of search results."
            );
            observer.unobserve(entry.target);
          }
        })
        .catch(error => {
          Notiflix.Notify.failure(
            'Sorry, there was an error while fetching images. Please try again'
          );
        });
    }
  });
}, options);