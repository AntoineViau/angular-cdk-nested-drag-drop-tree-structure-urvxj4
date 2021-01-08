import { Component, Inject, ViewEncapsulation } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { demoData, TreeNode, DropInfo } from "../data";
import { debounce } from "@agentepsilon/decko";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  nodes: TreeNode[] = demoData;

  // ids for connected drop lists
  dropTargetIds = ["item2501"];
  nodeLookup = {};
  dropActionTodo: DropInfo = null;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.prepareDragDrop(this.nodes);
  }

  prepareDragDrop(nodes: TreeNode[]) {
    nodes.forEach(node => {
      this.dropTargetIds.push(node.id);
      this.nodeLookup[node.id] = node;
      this.prepareDragDrop(node.children);
    });
  }

  @debounce(50)
  dragMoved(event) {
    let e = this.document.elementFromPoint(
      event.pointerPosition.x,
      event.pointerPosition.y
    );

    if (!e) {
      this.clearDragInfo();
      return;
    }
    let container = e.classList.contains("node-item")
      ? e
      : e.closest(".node-item");
    if (!container) {
      this.clearDragInfo();
      return;
    }
    this.dropActionTodo = {
      targetId: container.getAttribute("data-id")
    };
    const targetRect = container.getBoundingClientRect();
    const oneThird = targetRect.height / 3;

    if (event.pointerPosition.y - targetRect.top < oneThird) {
      // before
      this.dropActionTodo["action"] = "before";
    } else if (event.pointerPosition.y - targetRect.top > 2 * oneThird) {
      // after
      this.dropActionTodo["action"] = "after";
    } else {
      // inside
      this.dropActionTodo["action"] = "inside";
    }
    this.showDragInfo();
  }

  drop(event) {
    if (!this.dropActionTodo) return;

    const draggedItemId = event.item.data;
    const parentItemId = event.previousContainer.id;
    const targetListId = this.getParentNodeId(
      this.dropActionTodo.targetId,
      this.nodes,
      "main"
    );

    console.log(
      "\nmoving\n[" + draggedItemId + "] from list [" + parentItemId + "]",
      "\n[" +
        this.dropActionTodo.action +
        "]\n[" +
        this.dropActionTodo.targetId +
        "] from list [" +
        targetListId +
        "]"
    );

    const draggedItem = this.nodeLookup[draggedItemId];

    const oldItemContainer =
      parentItemId != "main"
        ? this.nodeLookup[parentItemId].children
        : this.nodes;
    const newContainer =
      targetListId != "main"
        ? this.nodeLookup[targetListId].children
        : this.nodes;

    let i = oldItemContainer.findIndex(c => c.id === draggedItemId);
    oldItemContainer.splice(i, 1);

    switch (this.dropActionTodo.action) {
      case "before":
      case "after":
        const targetIndex = newContainer.findIndex(
          c => c.id === this.dropActionTodo.targetId
        );
        if (this.dropActionTodo.action == "before") {
          newContainer.splice(targetIndex, 0, draggedItem);
        } else {
          newContainer.splice(targetIndex + 1, 0, draggedItem);
        }
        break;

      case "inside":
        this.nodeLookup[this.dropActionTodo.targetId].children.push(
          draggedItem
        );
        this.nodeLookup[this.dropActionTodo.targetId].isExpanded = true;
        break;
    }

    this.clearDragInfo(true);
  }
  getParentNodeId(
    id: string,
    nodesToSearch: TreeNode[],
    parentId: string
  ): string {
    for (let node of nodesToSearch) {
      if (node.id == id) return parentId;
      let ret = this.getParentNodeId(id, node.children, node.id);
      if (ret) return ret;
    }
    return null;
  }
  showDragInfo() {
    this.clearDragInfo();
    if (this.dropActionTodo) {
      this.document
        .getElementById("node-" + this.dropActionTodo.targetId)
        .classList.add("drop-" + this.dropActionTodo.action);
    }
  }
  clearDragInfo(dropped = false) {
    if (dropped) {
      this.dropActionTodo = null;
    }
    this.document
      .querySelectorAll(".drop-before")
      .forEach(element => element.classList.remove("drop-before"));
    this.document
      .querySelectorAll(".drop-after")
      .forEach(element => element.classList.remove("drop-after"));
    this.document
      .querySelectorAll(".drop-inside")
      .forEach(element => element.classList.remove("drop-inside"));
  }
}
