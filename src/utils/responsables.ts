import type { Responsable } from "../types";

interface NameParts {
  id: string;
  firstName: string;
  surname: string;
  normalizedFirstName: string;
  normalizedSurname: string;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

function splitName(value: string): { firstName: string; surname: string } {
  const [firstName = "", ...surnameParts] = value.trim().split(/\s+/);
  return { firstName, surname: surnameParts.join(" ") };
}

export function formatResponsableNames(
  responsables: Responsable[],
): Map<string, string> {
  const parts: NameParts[] = responsables.map((responsable) => {
    const { firstName, surname } = splitName(responsable.nombre);
    return {
      id: responsable.id,
      firstName,
      surname,
      normalizedFirstName: normalizeName(firstName),
      normalizedSurname: normalizeName(surname).replace(/\s/g, ""),
    };
  });
  const byFirstName = new Map<string, NameParts[]>();

  for (const person of parts) {
    const group = byFirstName.get(person.normalizedFirstName) ?? [];
    group.push(person);
    byFirstName.set(person.normalizedFirstName, group);
  }

  const formatted = new Map<string, string>();
  for (const person of parts) {
    const group = byFirstName.get(person.normalizedFirstName) ?? [];
    if (group.length < 2) {
      formatted.set(person.id, person.firstName);
      continue;
    }

    const surnameCharacters = Array.from(person.surname.replace(/\s/g, ""));
    const normalizedCharacters = Array.from(person.normalizedSurname);
    let prefixLength = 1;
    while (
      prefixLength < normalizedCharacters.length &&
      group.some(
        (other) =>
          other.id !== person.id &&
          Array.from(other.normalizedSurname)
            .slice(0, prefixLength)
            .join("") === normalizedCharacters.slice(0, prefixLength).join(""),
      )
    ) {
      prefixLength += 1;
    }

    const surnamePrefix = surnameCharacters.slice(0, prefixLength).join("");
    formatted.set(
      person.id,
      surnamePrefix ? `${person.firstName} ${surnamePrefix}.` : person.firstName,
    );
  }

  return formatted;
}

export function formatResponsableName(
  nameOrId: string,
  responsables: Responsable[],
  formattedNames: ReadonlyMap<string, string>,
): string {
  const normalizedValue = normalizeName(nameOrId);
  const exactMatch = responsables.find(
    (responsable) =>
      normalizeName(responsable.id) === normalizedValue ||
      normalizeName(responsable.nombre) === normalizedValue ||
      normalizeName(responsable.usuario) === normalizedValue,
  );
  if (exactMatch) {
    return formattedNames.get(exactMatch.id) ?? splitName(exactMatch.nombre).firstName;
  }

  const firstNameMatches = responsables.filter(
    (responsable) =>
      normalizeName(splitName(responsable.nombre).firstName) === normalizedValue,
  );
  if (firstNameMatches.length === 1) {
    return formattedNames.get(firstNameMatches[0].id) ?? nameOrId;
  }

  return splitName(nameOrId).firstName || nameOrId;
}
