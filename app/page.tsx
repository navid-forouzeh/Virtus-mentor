import EnablePushButton from "./components/EnablePushButton";

export default function Page() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Virtus Mentor</h1>
      <p>Tippe unten, um Push zu aktivieren.</p>
      <EnablePushButton />
    </main>
  );
}