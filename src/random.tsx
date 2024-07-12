import { getPreferenceValues, LocalStorage, LaunchProps, showHUD, closeMainWindow } from "@raycast/api";
import { fakerFR as faker } from "@faker-js/faker";
import { runAppleScript } from "@raycast/utils";

interface RandomArgument {
  type?: string;
}

export default async function Command(props: LaunchProps<{ arguments: RandomArgument }>) {
  const preferences = getPreferenceValues();
  const currentGender = props.arguments?.type === "f" ? "female" : "male";

  const firstname = faker.person.firstName(currentGender).toLowerCase();
  const lastname = faker.person.lastName(currentGender).toLowerCase();
  const adjective = faker.word
    .adjective()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const removeAccents = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(" ", "");
  };

  const email =
    removeAccents(
      (() => {
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
      })(),
    ) + `@${preferences.email_domain}`;

  const datetime = new Date().toISOString();

  const nbItems = Object.keys(await LocalStorage.allItems()).length;
  await LocalStorage.setItem(`email-${nbItems}`, email);
  await LocalStorage.setItem(`datetime-${nbItems}`, datetime);

  await pasteSelectedEmail(email);
}

export async function pasteSelectedEmail(email: string) {
  await closeMainWindow({ clearRootSearch: true });

  try {
    // we use AppleScript to type the email because it allow to type in non copy/pasteable fields
    await runAppleScript(`tell application "System Events" to keystroke "${email}"`);
    await showHUD(`${email} pasted`);
  } catch (error: any) {
    await showHUD(`Failed to paste email: ${error.message}`);
  }
}
