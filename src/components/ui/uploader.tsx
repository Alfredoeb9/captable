"use client";

import { uploadFile } from "@/common/uploads";
import { api } from "@/trpc/react";
import type React from "react";
import { useCallback, useState } from "react";
import {
  type DropzoneOptions,
  type FileWithPath,
  useDropzone,
} from "react-dropzone";
import { toast } from "sonner";
import { Button } from "./button";

import type { TypeKeyPrefixes } from "@/server/file-uploads";
import type { RouterOutputs } from "@/trpc/shared";

export type UploadReturn = RouterOutputs["bucket"]["create"];

type DocumentUploadDropzone = Omit<
  DropzoneOptions,
  "noClick" | "noKeyboard" | "onDrop"
>;

type UploadProps =
  | {
      shouldUpload?: true;
      onSuccess?: (data: UploadReturn) => void | Promise<void>;
      identifier: string;
      keyPrefix: TypeKeyPrefixes;
    }
  | {
      shouldUpload: false;
      onSuccess?: (data: FileWithPath[]) => void | Promise<void>;
      identifier?: never;
      keyPrefix?: never;
    };

type Props = {
  header?: React.ReactNode;
  // should be companyPublicId or memberId or userId

  multiple?: boolean;
} & DocumentUploadDropzone &
  UploadProps;

export function Uploader(props: Props) {
  const {
    multiple,
    onSuccess,
    shouldUpload: _shouldUpload,
    identifier: _identifier,
    keyPrefix: _keyPrefix,
    header,
    ...rest
  } = props;

  const [uploading, setUploading] = useState(false);
  const { mutateAsync } = api.bucket.create.useMutation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    try {
      if (!multiple && acceptedFiles.length > 1) {
        toast.error("Files exceeded, please upload only one file.");
        return;
      }

      setUploading(true);

      if (props.shouldUpload !== false) {
        for (const file of acceptedFiles) {
          const { key, mimeType, name, size } = await uploadFile(file, {
            identifier: props.identifier,
            keyPrefix: props.keyPrefix,
          });

          const data = await mutateAsync({ key, mimeType, name, size });

          if (onSuccess) {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            await onSuccess(data as any);
          }

          toast.success("🎉 Successfully uploaded");
        }
      } else {
        if (onSuccess) {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          await onSuccess(acceptedFiles as any);
        }
        toast.success("🎉 Successfully uploaded");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Uh oh! Something went wrong, please try again.");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    ...rest,
    noClick: true,
    noKeyboard: true,
    onDrop,
  });

  return (
    <section className="w-full">
      <div
        {...getRootProps({ className: "dropzone" })}
        className="flex w-full flex-col items-center justify-center  rounded-md border border-dashed border-border px-5 py-10"
      >
        {header}
        <input {...getInputProps()} multiple={multiple} />
        <p className="text-center text-neutral-500">
          Drop & drop, or select a file to upload
        </p>
        <Button
          onClick={open}
          variant={"default"}
          className="mt-5"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Select a file"}
        </Button>
      </div>
    </section>
  );
}

export default Uploader;
