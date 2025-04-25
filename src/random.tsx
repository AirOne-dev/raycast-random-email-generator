import { getPreferenceValues, LocalStorage, LaunchProps, showHUD, closeMainWindow } from "@raycast/api";
import { fakerFR as faker } from "@faker-js/faker";
import { runAppleScript } from "@raycast/utils";

interface RandomArgument {
  type?: string;
}

export default async function Command(props: LaunchProps<{ arguments: RandomArgument }>) {
  const currentGender = props.arguments?.type === "f" ? "female" : "male";

  const firstname = faker.person.firstName(currentGender);
  const lastname = faker.person.lastName(currentGender);
  const adjective = faker.word.adjective();

  const removeSpecialCharacters = (str: string): string => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(" ", "");
  };

  const email =
    removeSpecialCharacters(
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
    ) + `@${getPreferenceValues().email_domain}`;

  const nbItems = Object.keys(await LocalStorage.allItems()).filter((key) => key.startsWith("email-")).length;
  await LocalStorage.setItem(`email-${nbItems}`, email);
  await LocalStorage.setItem(`datetime-${nbItems}`, new Date().toISOString());

  await pasteSelectedEmail(email);
}

export async function pasteSelectedEmail(email: string) {
  await closeMainWindow({ clearRootSearch: true });

  try {
    // we use AppleScript to type the email because it allow to type in non copy/pasteable fields
    await runAppleScript(`tell application "System Events" to keystroke "${email}"`);
    await showHUD(`${email} pasted`);
  } catch (error: Error) {
    await showHUD(`Failed to paste email: ${error.message}`);
  }
}
