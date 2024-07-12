import { useEffect, useState } from "react";
import { Action, ActionPanel, LocalStorage, List } from "@raycast/api";
import { pasteSelectedEmail } from "./random";

export default function Command() {
  const data: { email: string; datetime: string; id: number }[] = [];

  const [isLoading, setIsLoading] = useState(true);
  const [showingDetail] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredList, setFilteredList] = useState(data);

  const clearStorage = async () => {
    setIsLoading(true);
    await LocalStorage.clear();
    data.splice(0, data.length);
    setFilteredList(data);
    setIsLoading(false);
  };

  const getStorage = async () => {
    return Object.entries(await LocalStorage.allItems());
  };

  useEffect(() => {
    if (isLoading) {
      getStorage().then((storage) => {
        storage.forEach((item) => {
          if (item[0].startsWith("email-")) {
            const index = item[0].split("-")[1];
            const datetime = new Date((storage.find((item) => item[0] === `datetime-${index}`) ?? [null, null])[1]);
            data.push({
              id: parseInt(index),
              email: item[1],
              datetime: `${datetime.getDate()}/${
                datetime.getMonth() + 1
              }/${datetime.getFullYear()} ${datetime.getHours()}:${datetime.getMinutes()}:${datetime.getSeconds()}`,
            });
          }
        });
        setIsLoading(false);
      });
    } else {
      setFilteredList(data.filter(({ email }) => email.includes(searchText)).sort((a, b) => b.id - a.id));
    }
  }, [searchText]);

  return (
    <List
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search for previously generated email"
      isLoading={isLoading}
      isShowingDetail={showingDetail}
    >
      {filteredList.map((item) => (
        <List.Item
          key={item.email}
          title={`${item.email} (${item.datetime})`}
          actions={
            <ActionPanel>
              <Action title="Select" onAction={() => pasteSelectedEmail(item.email)} />
              <Action title="Clear History" onAction={() => clearStorage()} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
