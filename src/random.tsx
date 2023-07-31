import { Clipboard, getPreferenceValues, LocalStorage, showHUD } from "@raycast/api";
import { fakerFR as faker } from '@faker-js/faker';

export default async function Command() {
  const preferences = getPreferenceValues();

  const firstname = faker.person.firstName().toLowerCase();
  const lastname = faker.person.lastName().toLowerCase();
  const adjective = faker.word.adjective().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const removeAccents = (str: string): string => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const email = removeAccents((() => {
    switch (Math.floor(Math.random() * 4)) {
      case 0:
        return `${firstname}.${lastname}`;
      case 1:
        return `${lastname}.${firstname}`;
      case 2:
        return `${firstname}.${adjective}`;
      default:
        return `${lastname}.${adjective}`;
    }
  })()) + `@${preferences.email_domain}`;

  const datetime = new Date().toISOString();

  const nbItems = Object.keys(await LocalStorage.allItems()).length;
  await LocalStorage.setItem(`email-${nbItems}`, email);
  await LocalStorage.setItem(`datetime-${nbItems}`, datetime);
  
  pasteSelectedEmail(email);
}

export function pasteSelectedEmail(email: string) {
  Clipboard.paste(email);
  showHUD(`${email} pasted`);
}
