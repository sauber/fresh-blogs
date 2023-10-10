import InvestorList from "../islands/investor/List.tsx";

export default function Home() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 1);

  return (
    <div class="p-4 mx-auto max-w-screen-md">
      <h1 class="my-6 text-3xl">
        Welcome to `🥤 Fresh Blogs 🍋`!
      </h1>
      <p class="my-6">Fresh ideas everyday</p>
      <InvestorList target={date.toISOString()} />
    </div>
  );
}