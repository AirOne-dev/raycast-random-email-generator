import { useEffect, useState } from "react";
import { Action, ActionPanel, Alert, confirmAlert, Icon, List, LocalStorage } from "@raycast/api";
import { pasteSelectedEmail } from "./random";
import ActionStyle = Alert.ActionStyle;

interface EmailItem {
  id: number;
  email: string;
  datetime: string;
  rawDate: Date;
}

export default function Command() {
  const [items, setItems] = useState<EmailItem[]>([]);
  const [sort, setSort] = useState<string>('date-desc');
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredList, setFilteredList] = useState<EmailItem[]>([]);

  // Format date with leading zeros for hours, minutes, seconds
  const formatDate = (date: Date): string => {
    const pad = (num: number) => (num < 10 ? `0${num}` : num);
    return `${date.getDate()}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  // Load all email data from storage
  const loadData = async () => {
    setIsLoading(true);
    try {
      const storage = Object.entries(await LocalStorage.allItems());
      const emailData: EmailItem[] = [];

      storage.forEach((item) => {
        if (item[0].startsWith("email-")) {
          const index = item[0].split("-")[1];
          const dateTimeItem = storage.find((storageItem) => storageItem[0] === `datetime-${index}`);

          if (dateTimeItem) {
            const rawDate = new Date(dateTimeItem[1]);
            emailData.push({
              id: parseInt(index),
              email: item[1],
              datetime: formatDate(rawDate),
              rawDate,
            });
          }
        }
      });

      // Sort by ID in descending order (newest first)
      const sortedData = emailData.sort((a, b) => b.id - a.id);
      setItems(sortedData);
      setFilteredList(sortedData);
    } catch (error) {
      console.error("Error loading email history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all storage
  const clearStorage = async () => {
    const confirmed = await confirmAlert({
      title: "Clear Email History",
      message: "Are you sure you want to clear all email history?",
      primaryAction: {
        title: "Clear",
        style: ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      setIsLoading(true);
      await LocalStorage.clear();
      setItems([]);
      setFilteredList([]);
      setIsLoading(false);
    }
  };

  // Delete a single email
  const deleteEmail = async (id: number) => {
    await LocalStorage.removeItem(`email-${id}`);
    await LocalStorage.removeItem(`datetime-${id}`);

    // Update state to remove the deleted item
    const updatedItems = items.filter((item) => item.id !== id);
    setItems(updatedItems);
    setFilteredList(updatedItems.filter((item) => item.email.includes(searchText)));
  };

  const loadSortPreference = async () => {
    const storedSort = await LocalStorage.getItem<string>("sort");
    if (storedSort) {
      setSort(storedSort);
    }
  };

  // Filter emails when search text changes
  useEffect(() => {
    if (!isLoading) {
      setFilteredList(items.filter((item) => item.email.toLowerCase().includes(searchText.toLowerCase())));
    }
  }, [searchText, items]);

  // Update filtered list when sort changes
  useEffect(() => {
    const sorted = [...filteredList];
    switch (sort) {
      case "date-desc":
        sorted.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
        break;
      case "date-asc":
        sorted.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
        break;
      case "email-asc":
        sorted.sort((a, b) => a.email.localeCompare(b.email));
        break;
      case "email-desc":
        sorted.sort((a, b) => b.email.localeCompare(a.email));
        break;
    }
    setFilteredList(sorted);
  }, [sort]);

  // Load data on component mount
  useEffect(() => {
    void loadData().then(() => loadSortPreference());
  }, []);

  return (
    <List
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search for previously generated email"
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Sort By"
          value={sort}
          onChange={async (newValue) => {
            await LocalStorage.setItem("sort", newValue).then(() => setSort(newValue));
          }}
        >
          <List.Dropdown.Item title="Newest First" value="date-desc" />
          <List.Dropdown.Item title="Oldest First" value="date-asc" />
          <List.Dropdown.Item title="Email (A → Z)" value="email-asc" />
          <List.Dropdown.Item title="Email (Z → A)" value="email-desc" />
        </List.Dropdown>
      }
    >
      <List.Section title={`Email History (${filteredList.length})`}>
        {filteredList.map((item) => (
          <List.Item
            key={item.id}
            title={item.email}
            subtitle={item.datetime}
            accessories={[ { text: `ID: ${item.id}` } ]}
            icon={Icon.Envelope}
            actions={
              <ActionPanel>
                <Action title="Paste Email" icon={Icon.Clipboard} onAction={() => pasteSelectedEmail(item.email)} />
                <Action
                  title="Delete This Email"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={() => deleteEmail(item.id)}
                />
                <Action
                  title="Clear All History"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={clearStorage}
                />
                <Action title="Refresh" icon={Icon.ArrowClockwise} onAction={loadData} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      {filteredList.length === 0 && !isLoading && (
        <List.EmptyView
          title="No Emails Found"
          description={searchText ? "Try a different search term" : "Generate some emails to see them here"}
          icon={Icon.Footprints}
        />
      )}
    </List>
  );
}
