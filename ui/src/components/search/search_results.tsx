import { useSearch } from "hooks/search";
import { SearchResult } from "types";

type ArgsSearchWrapper = {
  query: string;
}


type ArgsSearchResults = {
  items: SearchResult[] | null;
}

type ArgsSearchResultItem = {
  item: SearchResult;
}


function SearchResultItem({item}: ArgsSearchResultItem) {
  return (
    <div>
      <div>{item.id} {item.document_id} {item.entity_type} {item.title}</div>
    </div>
  );
}


function SearchResults({items}: ArgsSearchResults) {

  if (items && items.length == 0)  {
    return <div>No results found</div>;
  }

  if (!items) {
    return <div>No results found</div>;
  }

  const result_items = items.map((item: SearchResult) => {
      return <SearchResultItem item={item} />
  })

  return <div>{result_items}</div>;
}


function SearchResultsWrapper({query}: ArgsSearchWrapper) {
  const { data, error, is_loading } = useSearch(query);

  if (is_loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error</div>;
  }

  return (<>
    <SearchResults items={data}/>
  </>)
}

export default SearchResultsWrapper;
