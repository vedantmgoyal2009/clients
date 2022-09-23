export class UpdateProfileRequest {
  name: string;
  masterPasswordHint: string;
  culture = "en-US"; // deprecated
  avatarColor: string;

  constructor(name: string, masterPasswordHint: string) {
    this.name = name;
    this.masterPasswordHint = masterPasswordHint ? masterPasswordHint : null;
  }
}
