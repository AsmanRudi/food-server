import { useAuthStore } from "../store/authStore";

const Profile = () => {
  const user = useAuthStore(
    (state) => state.user
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">

      <h1 className="text-4xl font-black">
        Profile
      </h1>

      <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">

        <div className="space-y-5">

          <div>
            <p className="text-sm text-slate-500">
              Nama
            </p>

            <p className="mt-1 text-lg font-bold">
              {user?.full_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Email
            </p>

            <p className="mt-1 text-lg font-bold">
              {user?.email}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Role
            </p>

            <p className="mt-1 text-lg font-bold capitalize">
              {user?.role}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Profile;